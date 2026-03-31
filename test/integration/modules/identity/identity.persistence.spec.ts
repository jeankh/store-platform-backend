import { randomUUID } from "node:crypto";

import { PrismaClient, TenantStatus, UserStatus } from "@prisma/client";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { PrismaIdentityAuthRepository } from "src/modules/identity/infrastructure/persistence/prisma-identity-auth.repository";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url:
        process.env.DATABASE_URL ||
        "postgresql://postgres:postgres@localhost:5432/e_com_backend",
    },
  },
});

const repository = new PrismaIdentityAuthRepository(prisma as any);

async function resetDatabase() {
  await prisma.rolePermission.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.authSession.deleteMany();
  await prisma.staffProfile.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.role.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.storeSettings.deleteMany();
  await prisma.store.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenantSettings.deleteMany();
  await prisma.tenant.deleteMany();
}

describe("Identity module integration tests", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await resetDatabase();
    await prisma.$disconnect();
  });

  it("persists a new user with hashed password", async () => {
    const tenant = await prisma.tenant.create({
      data: {
        slug: `tenant-${randomUUID()}`,
        name: "Tenant 1",
        status: TenantStatus.ACTIVE,
      },
    });

    const user = await repository.createBootstrapAdmin({
      tenantId: tenant.id,
      email: "owner@tenant.test",
      passwordHash: "hashed-password",
      firstName: "Tenant",
      lastName: "Owner",
    });

    const storedUser = await prisma.user.findUnique({ where: { id: user.id } });

    expect(storedUser?.passwordHash).toBe("hashed-password");
  });

  it("persists a staff profile linked to a user", async () => {
    const tenant = await prisma.tenant.create({
      data: {
        slug: `tenant-${randomUUID()}`,
        name: "Tenant 1",
        status: TenantStatus.ACTIVE,
      },
    });

    const user = await repository.createBootstrapAdmin({
      tenantId: tenant.id,
      email: "owner@tenant.test",
      passwordHash: "hashed-password",
      firstName: "Tenant",
      lastName: "Owner",
    });

    const profile = await prisma.staffProfile.findUnique({
      where: { userId: user.id },
    });

    expect(profile?.firstName).toBe("Tenant");
    expect(profile?.lastName).toBe("Owner");
  });

  it("creates an auth session on login", async () => {
    const tenant = await prisma.tenant.create({
      data: {
        slug: `tenant-${randomUUID()}`,
        name: "Tenant 1",
        status: TenantStatus.ACTIVE,
      },
    });
    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: "owner@tenant.test",
        passwordHash: "hashed-password",
        status: UserStatus.ACTIVE,
      },
    });

    const session = await repository.createAuthSession({
      userId: user.id,
      expiresAt: new Date(Date.now() + 60_000),
      ipAddress: "127.0.0.1",
      userAgent: "vitest",
    });

    const storedSession = await prisma.authSession.findUnique({
      where: { id: session.id },
    });

    expect(storedSession?.userId).toBe(user.id);
  });

  it("creates a refresh token record on login", async () => {
    const tenant = await prisma.tenant.create({
      data: {
        slug: `tenant-${randomUUID()}`,
        name: "Tenant 1",
        status: TenantStatus.ACTIVE,
      },
    });
    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: "owner@tenant.test",
        passwordHash: "hashed-password",
        status: UserStatus.ACTIVE,
      },
    });
    const session = await prisma.authSession.create({
      data: {
        userId: user.id,
        expiresAt: new Date(Date.now() + 60_000),
      },
    });

    const refreshToken = await repository.storeRefreshToken({
      userId: user.id,
      sessionId: session.id,
      tokenHash: "hash-1",
      expiresAt: new Date(Date.now() + 60_000),
    });

    const storedRefreshToken = await prisma.refreshToken.findUnique({
      where: { id: refreshToken.id },
    });

    expect(storedRefreshToken?.tokenHash).toBe("hash-1");
  });

  it("marks a refresh token revoked on logout", async () => {
    const tenant = await prisma.tenant.create({
      data: {
        slug: `tenant-${randomUUID()}`,
        name: "Tenant 1",
        status: TenantStatus.ACTIVE,
      },
    });
    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: "owner@tenant.test",
        passwordHash: "hashed-password",
        status: UserStatus.ACTIVE,
      },
    });
    const session = await prisma.authSession.create({
      data: {
        userId: user.id,
        expiresAt: new Date(Date.now() + 60_000),
      },
    });
    const refreshToken = await prisma.refreshToken.create({
      data: {
        userId: user.id,
        sessionId: session.id,
        tokenHash: "hash-1",
        expiresAt: new Date(Date.now() + 60_000),
      },
    });

    await repository.revokeRefreshToken(refreshToken.id, new Date());

    const storedRefreshToken = await prisma.refreshToken.findUnique({
      where: { id: refreshToken.id },
    });

    expect(storedRefreshToken?.revokedAt).toBeInstanceOf(Date);
  });
});

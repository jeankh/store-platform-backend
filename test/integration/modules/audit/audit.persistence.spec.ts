import { randomUUID } from "node:crypto";

import { PrismaClient, TenantStatus, UserStatus } from "@prisma/client";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { PrismaAuditRepository } from "src/modules/audit/infrastructure/persistence/prisma-audit.repository";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url:
        process.env.DATABASE_URL ||
        "postgresql://postgres:postgres@localhost:5432/e_com_backend",
    },
  },
});

const repository = new PrismaAuditRepository(prisma as any);

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

describe("Audit module integration tests", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await resetDatabase();
    await prisma.$disconnect();
  });

  async function createTenantAndUser() {
    const tenant = await prisma.tenant.create({
      data: {
        slug: `tenant-${randomUUID()}`,
        name: "Tenant",
        status: TenantStatus.ACTIVE,
        settings: { create: { defaultLocale: "en", defaultCurrency: "USD" } },
      },
    });
    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: "user@test.com",
        passwordHash: "hash",
        status: UserStatus.ACTIVE,
      },
    });

    return { tenant, user };
  }

  it("persists an audit log for a tenant mutation", async () => {
    const { tenant, user } = await createTenantAndUser();
    const log = await repository.create({
      tenantId: tenant.id,
      actorUserId: user.id,
      action: "tenant.updated",
      entityType: "tenant",
      entityId: tenant.id,
    });
    const stored = await prisma.auditLog.findUnique({ where: { id: log.id } });
    expect(stored?.action).toBe("tenant.updated");
  });

  it("persists an audit log for a store mutation", async () => {
    const { tenant, user } = await createTenantAndUser();
    const log = await repository.create({
      tenantId: tenant.id,
      actorUserId: user.id,
      action: "store.updated",
      entityType: "store",
      entityId: "store-1",
    });
    const stored = await prisma.auditLog.findUnique({ where: { id: log.id } });
    expect(stored?.entityType).toBe("store");
  });

  it("persists an audit log for a role assignment", async () => {
    const { tenant, user } = await createTenantAndUser();
    const log = await repository.create({
      tenantId: tenant.id,
      actorUserId: user.id,
      action: "role.assigned",
      entityType: "user_role",
      entityId: "u:r",
    });
    const stored = await prisma.auditLog.findUnique({ where: { id: log.id } });
    expect(stored?.action).toBe("role.assigned");
  });

  it("returns audit logs ordered by most recent first", async () => {
    const { tenant, user } = await createTenantAndUser();
    await repository.create({
      tenantId: tenant.id,
      actorUserId: user.id,
      action: "first",
      entityType: "tenant",
      entityId: "1",
    });
    await repository.create({
      tenantId: tenant.id,
      actorUserId: user.id,
      action: "second",
      entityType: "tenant",
      entityId: "2",
    });

    const logs = await repository.list({ tenantId: tenant.id });
    expect(logs[0].action).toBe("second");
  });
});

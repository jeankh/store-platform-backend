import { randomUUID } from "node:crypto";

import { PrismaClient, TenantStatus, UserStatus } from "@prisma/client";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { PrismaAccessControlRepository } from "src/modules/access-control/infrastructure/persistence/prisma-access-control.repository";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url:
        process.env.DATABASE_URL ||
        "postgresql://postgres:postgres@localhost:5432/e_com_backend",
    },
  },
});

const repository = new PrismaAccessControlRepository(prisma as any);

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

describe("Access control module integration tests", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await resetDatabase();
    await prisma.$disconnect();
  });

  async function createTenant() {
    return prisma.tenant.create({
      data: {
        slug: `tenant-${randomUUID()}`,
        name: "Tenant",
        status: TenantStatus.ACTIVE,
        settings: { create: { defaultLocale: "en", defaultCurrency: "USD" } },
      },
    });
  }

  it("persists roles for a tenant", async () => {
    const tenant = await createTenant();
    await repository.seedSystemPermissions();
    const role = await repository.createRole({
      tenantId: tenant.id,
      name: "Manager",
      code: "manager",
      permissionCodes: ["role.read"],
    });

    const stored = await prisma.role.findUnique({ where: { id: role.id } });
    expect(stored?.tenantId).toBe(tenant.id);
  });

  it("persists role-permission mappings", async () => {
    const tenant = await createTenant();
    await repository.seedSystemPermissions();
    const role = await repository.createRole({
      tenantId: tenant.id,
      name: "Manager",
      code: "manager",
      permissionCodes: ["role.read", "role.create"],
    });

    const mappings = await prisma.rolePermission.findMany({
      where: { roleId: role.id },
    });
    expect(mappings.length).toBe(2);
  });

  it("persists user-role mappings", async () => {
    const tenant = await createTenant();
    await repository.seedSystemPermissions();
    const role = await repository.createRole({
      tenantId: tenant.id,
      name: "Manager",
      code: "manager",
      permissionCodes: ["role.read"],
    });
    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: "user@test.com",
        passwordHash: "hash",
        status: UserStatus.ACTIVE,
      },
    });

    await repository.assignRole({
      tenantId: tenant.id,
      userId: user.id,
      roleId: role.id,
    });

    const mapping = await prisma.userRole.findFirst({
      where: { userId: user.id, roleId: role.id },
    });
    expect(mapping).not.toBeNull();
  });

  it("returns roles and permissions for the tenant scope", async () => {
    const tenant = await createTenant();
    await repository.seedSystemPermissions();
    await repository.createRole({
      tenantId: tenant.id,
      name: "Manager",
      code: "manager",
      permissionCodes: ["role.read"],
    });

    const roles = await repository.listRoles(tenant.id);
    const permissions = await repository.listPermissions();

    expect(roles).toHaveLength(1);
    expect(permissions.length).toBeGreaterThan(0);
  });

  it("enforces uniqueness for tenant_id and code in roles", async () => {
    const tenant = await createTenant();
    await repository.seedSystemPermissions();
    await repository.createRole({
      tenantId: tenant.id,
      name: "Manager",
      code: "manager",
      permissionCodes: ["role.read"],
    });

    await expect(
      repository.createRole({
        tenantId: tenant.id,
        name: "Manager 2",
        code: "manager",
        permissionCodes: ["role.read"],
      }),
    ).rejects.toThrow();
  });

  it("enforces global uniqueness for permission code", async () => {
    await repository.seedSystemPermissions();

    await expect(
      prisma.permission.create({
        data: {
          code: "role.read",
          name: "Dup",
          resource: "role",
          action: "read",
        },
      }),
    ).rejects.toThrow();
  });
});

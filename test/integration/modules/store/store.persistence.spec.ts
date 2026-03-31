import { randomUUID } from "node:crypto";

import { PrismaClient, TenantStatus } from "@prisma/client";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { PrismaStoreRepository } from "src/modules/store/infrastructure/persistence/prisma-store.repository";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url:
        process.env.DATABASE_URL ||
        "postgresql://postgres:postgres@localhost:5432/e_com_backend",
    },
  },
});

const repository = new PrismaStoreRepository(prisma as any);

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

describe("Store module integration tests", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await resetDatabase();
    await prisma.$disconnect();
  });

  async function createTenant(slugSuffix: string) {
    return prisma.tenant.create({
      data: {
        slug: `tenant-${slugSuffix}`,
        name: `Tenant ${slugSuffix}`,
        status: TenantStatus.ACTIVE,
        settings: {
          create: {
            defaultLocale: "en",
            defaultCurrency: "USD",
          },
        },
      },
    });
  }

  it("persists a store linked to a tenant", async () => {
    const tenant = await createTenant(randomUUID());
    const store = await repository.create({
      tenantId: tenant.id,
      slug: "main-store",
      name: "Main Store",
      defaultLocale: "en",
      defaultCurrency: "USD",
    });

    const stored = await prisma.store.findUnique({ where: { id: store.id } });
    expect(stored?.tenantId).toBe(tenant.id);
  });

  it("persists store settings linked to a store", async () => {
    const tenant = await createTenant(randomUUID());
    const store = await repository.create({
      tenantId: tenant.id,
      slug: "main-store",
      name: "Main Store",
      defaultLocale: "fr",
      defaultCurrency: "EUR",
    });

    const settings = await prisma.storeSettings.findUnique({
      where: { storeId: store.id },
    });
    expect(settings?.defaultLocale).toBe("fr");
    expect(settings?.defaultCurrency).toBe("EUR");
  });

  it("enforces uniqueness for tenant_id and slug", async () => {
    const tenant = await createTenant(randomUUID());
    await repository.create({
      tenantId: tenant.id,
      slug: "main-store",
      name: "Main Store",
      defaultLocale: "en",
      defaultCurrency: "USD",
    });

    await expect(
      repository.create({
        tenantId: tenant.id,
        slug: "main-store",
        name: "Other Store",
        defaultLocale: "en",
        defaultCurrency: "USD",
      }),
    ).rejects.toThrow();
  });

  it("returns stores filtered by tenant", async () => {
    const tenantA = await createTenant(randomUUID());
    const tenantB = await createTenant(randomUUID());
    await repository.create({
      tenantId: tenantA.id,
      slug: "store-a",
      name: "Store A",
      defaultLocale: "en",
      defaultCurrency: "USD",
    });
    await repository.create({
      tenantId: tenantB.id,
      slug: "store-b",
      name: "Store B",
      defaultLocale: "en",
      defaultCurrency: "USD",
    });

    const stores = await repository.listByTenant(tenantA.id);
    expect(stores).toHaveLength(1);
    expect(stores[0].tenantId).toBe(tenantA.id);
  });
});

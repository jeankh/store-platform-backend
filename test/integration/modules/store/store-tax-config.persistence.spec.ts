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
  await prisma.storeTaxConfig.deleteMany();
  await prisma.storeCurrency.deleteMany();
  await prisma.storeLocale.deleteMany();
  await prisma.storeSettings.deleteMany();
  await prisma.store.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenantSettings.deleteMany();
  await prisma.tenant.deleteMany();
}

describe("Store tax config integration tests", () => {
  beforeEach(async () => {
    await resetDatabase();
  });
  afterAll(async () => {
    await resetDatabase();
    await prisma.$disconnect();
  });

  async function createStore() {
    const tenant = await prisma.tenant.create({
      data: {
        slug: `tenant-${randomUUID()}`,
        name: "Tenant",
        status: TenantStatus.ACTIVE,
        settings: { create: { defaultLocale: "en", defaultCurrency: "USD" } },
      },
    });
    return repository.create({
      tenantId: tenant.id,
      slug: "main-store",
      name: "Main Store",
      defaultLocale: "en",
      defaultCurrency: "USD",
    });
  }

  it("persists one store_tax_configs row per store", async () => {
    const store = await createStore();
    const config = await repository.upsertTaxConfig({
      storeId: store.id,
      countryCode: "FR",
      taxInclusive: true,
    });
    const stored = await prisma.storeTaxConfig.findUnique({
      where: { storeId: store.id },
    });
    expect(config.countryCode).toBe("FR");
    expect(stored?.taxInclusive).toBe(true);
  });

  it("enforces unique store_id in tax config", async () => {
    const store = await createStore();
    await repository.upsertTaxConfig({
      storeId: store.id,
      countryCode: "FR",
      taxInclusive: true,
    });
    await repository.upsertTaxConfig({
      storeId: store.id,
      countryCode: "DE",
      taxInclusive: false,
    });
    const count = await prisma.storeTaxConfig.count({
      where: { storeId: store.id },
    });
    expect(count).toBe(1);
  });
});

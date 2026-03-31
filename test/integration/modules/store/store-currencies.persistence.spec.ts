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

describe("Store currencies integration tests", () => {
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

  it("persists store currency rows", async () => {
    const store = await createStore();
    const currency = await repository.addCurrency({
      storeId: store.id,
      currencyCode: "EUR",
    });
    const stored = await prisma.storeCurrency.findFirst({
      where: { storeId: store.id, currencyCode: currency.currencyCode },
    });
    expect(stored?.currencyCode).toBe("EUR");
  });

  it("enforces unique store_id and currency_code", async () => {
    const store = await createStore();
    await repository.addCurrency({ storeId: store.id, currencyCode: "EUR" });
    await expect(
      repository.addCurrency({ storeId: store.id, currencyCode: "EUR" }),
    ).rejects.toThrow();
  });

  it("supports switching default currency cleanly", async () => {
    const store = await createStore();
    await repository.addCurrency({
      storeId: store.id,
      currencyCode: "USD",
      isDefault: true,
    });
    await repository.addCurrency({
      storeId: store.id,
      currencyCode: "EUR",
      isDefault: true,
    });
    const currencies = await repository.listCurrencies(store.id);
    expect(currencies.filter((currency) => currency.isDefault)).toHaveLength(1);
    expect(
      currencies.find((currency) => currency.isDefault)?.currencyCode,
    ).toBe("EUR");
  });
});

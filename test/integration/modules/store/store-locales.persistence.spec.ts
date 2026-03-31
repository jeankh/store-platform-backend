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

describe("Store locales integration tests", () => {
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

  it("persists store locale rows", async () => {
    const store = await createStore();
    const locale = await repository.addLocale({
      storeId: store.id,
      localeCode: "fr-FR",
    });
    const stored = await prisma.storeLocale.findFirst({
      where: { storeId: store.id, localeCode: locale.localeCode },
    });
    expect(stored?.localeCode).toBe("fr-FR");
  });

  it("enforces unique store_id and locale_code", async () => {
    const store = await createStore();
    await repository.addLocale({ storeId: store.id, localeCode: "fr-FR" });
    await expect(
      repository.addLocale({ storeId: store.id, localeCode: "fr-FR" }),
    ).rejects.toThrow();
  });

  it("supports switching default locale cleanly", async () => {
    const store = await createStore();
    await repository.addLocale({
      storeId: store.id,
      localeCode: "en",
      isDefault: true,
    });
    await repository.addLocale({
      storeId: store.id,
      localeCode: "fr-FR",
      isDefault: true,
    });
    const locales = await repository.listLocales(store.id);
    expect(locales.filter((locale) => locale.isDefault)).toHaveLength(1);
    expect(locales.find((locale) => locale.isDefault)?.localeCode).toBe(
      "fr-FR",
    );
  });
});

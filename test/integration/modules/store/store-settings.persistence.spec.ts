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

describe("Store settings integration tests", () => {
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
        name: "Tenant 1",
        status: TenantStatus.ACTIVE,
        settings: {
          create: {
            defaultLocale: "en",
            defaultCurrency: "USD",
          },
        },
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

  it("persists extended store settings fields", async () => {
    const store = await createStore();

    const updated = await repository.updateSettings({
      storeId: store.id,
      displayName: "Main Store Display",
      supportEmail: "support@store.com",
      supportPhone: "+123456",
      timezone: "Europe/Paris",
      logoUrl: "https://cdn.test/logo.png",
      primaryColor: "#112233",
      secondaryColor: "#ffffff",
    });

    expect(updated.displayName).toBe("Main Store Display");

    const stored = await prisma.storeSettings.findUnique({
      where: { storeId: store.id },
    });

    expect(stored?.supportEmail).toBe("support@store.com");
    expect(stored?.logoUrl).toBe("https://cdn.test/logo.png");
  });

  it("updates existing store_settings row instead of creating a duplicate", async () => {
    const store = await createStore();

    await repository.updateSettings({
      storeId: store.id,
      displayName: "Version 1",
    });
    await repository.updateSettings({
      storeId: store.id,
      displayName: "Version 2",
    });

    const count = await prisma.storeSettings.count({
      where: { storeId: store.id },
    });
    const stored = await prisma.storeSettings.findUnique({
      where: { storeId: store.id },
    });

    expect(count).toBe(1);
    expect(stored?.displayName).toBe("Version 2");
  });
});

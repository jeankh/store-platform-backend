import { randomUUID } from "node:crypto";

import { PrismaClient } from "@prisma/client";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { PrismaTenantRepository } from "src/modules/tenant/infrastructure/persistence/prisma-tenant.repository";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url:
        process.env.DATABASE_URL ||
        "postgresql://postgres:postgres@localhost:5432/e_com_backend",
    },
  },
});

const repository = new PrismaTenantRepository(prisma as any);

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

describe("Tenant module integration tests", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await resetDatabase();
    await prisma.$disconnect();
  });

  it("persists a tenant record", async () => {
    const tenant = await repository.create({
      slug: `tenant-${randomUUID()}`,
      name: "Tenant 1",
      defaultLocale: "en",
      defaultCurrency: "USD",
    });

    const stored = await prisma.tenant.findUnique({ where: { id: tenant.id } });
    expect(stored?.name).toBe("Tenant 1");
  });

  it("persists a tenant settings record", async () => {
    const tenant = await repository.create({
      slug: `tenant-${randomUUID()}`,
      name: "Tenant 1",
      defaultLocale: "fr",
      defaultCurrency: "EUR",
    });

    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId: tenant.id },
    });
    expect(settings?.defaultLocale).toBe("fr");
    expect(settings?.defaultCurrency).toBe("EUR");
  });

  it("enforces unique tenant slug", async () => {
    const slug = `tenant-${randomUUID()}`;
    await repository.create({
      slug,
      name: "Tenant 1",
      defaultLocale: "en",
      defaultCurrency: "USD",
    });

    await expect(
      repository.create({
        slug,
        name: "Tenant 2",
        defaultLocale: "en",
        defaultCurrency: "USD",
      }),
    ).rejects.toThrow();
  });

  it("updates tenant and tenant settings in storage", async () => {
    const tenant = await repository.create({
      slug: `tenant-${randomUUID()}`,
      name: "Tenant 1",
      defaultLocale: "en",
      defaultCurrency: "USD",
    });

    const updated = await repository.update({
      tenantId: tenant.id,
      name: "Tenant Updated",
      defaultLocale: "es",
      defaultCurrency: "MXN",
    });

    expect(updated.name).toBe("Tenant Updated");

    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId: tenant.id },
    });
    expect(settings?.defaultLocale).toBe("es");
    expect(settings?.defaultCurrency).toBe("MXN");
  });
});

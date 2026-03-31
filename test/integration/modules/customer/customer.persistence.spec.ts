import { randomUUID } from "node:crypto";

import { PrismaClient, TenantStatus } from "@prisma/client";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { PrismaCustomerAuthRepository } from "src/modules/customer/infrastructure/persistence/prisma-customer-auth.repository";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url:
        process.env.DATABASE_URL ||
        "postgresql://postgres:postgres@localhost:5432/e_com_backend",
    },
  },
});
const repository = new PrismaCustomerAuthRepository(prisma as any);

async function resetDatabase() {
  await prisma.customerAddress.deleteMany();
  await prisma.customerSession.deleteMany();
  await prisma.customerPreference.deleteMany();
  await prisma.customer.deleteMany();
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

describe("Customer persistence integration tests", () => {
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

  it("persists customer record", async () => {
    const tenant = await createTenant();
    const customer = await repository.createCustomer({
      tenantId: tenant.id,
      email: "customer@test.com",
      passwordHash: "hash",
      firstName: "John",
      lastName: "Doe",
    });
    const stored = await prisma.customer.findUnique({
      where: { id: customer.id },
    });
    expect(stored?.email).toBe("customer@test.com");
  });

  it("persists customer preferences record", async () => {
    const tenant = await createTenant();
    const customer = await repository.createCustomer({
      tenantId: tenant.id,
      email: "customer@test.com",
      passwordHash: "hash",
      firstName: "John",
      lastName: "Doe",
    });
    const prefs = await prisma.customerPreference.findUnique({
      where: { customerId: customer.id },
    });
    expect(prefs).not.toBeNull();
  });

  it("enforces unique tenant_id and email for customers", async () => {
    const tenant = await createTenant();
    await repository.createCustomer({
      tenantId: tenant.id,
      email: "customer@test.com",
      passwordHash: "hash",
      firstName: "John",
      lastName: "Doe",
    });
    await expect(
      repository.createCustomer({
        tenantId: tenant.id,
        email: "customer@test.com",
        passwordHash: "hash",
        firstName: "Jane",
        lastName: "Doe",
      }),
    ).rejects.toThrow();
  });
});

import { randomUUID } from "node:crypto";

import { PrismaClient, TenantStatus } from "@prisma/client";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { PrismaPricingRepository } from "src/modules/pricing/infrastructure/persistence/prisma-pricing.repository";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url:
        process.env.DATABASE_URL ||
        "postgresql://postgres:postgres@localhost:5432/e_com_backend",
    },
  },
});
const repository = new PrismaPricingRepository(prisma as any);

async function resetDatabase() {
  await prisma.promotionUsage.deleteMany();
  await prisma.promotionRule.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.scheduledPrice.deleteMany();
  await prisma.compareAtPrice.deleteMany();
  await prisma.price.deleteMany();
  await prisma.variantAttributeValue.deleteMany();
  await prisma.productMedia.deleteMany();
  await prisma.productTag.deleteMany();
  await prisma.productCollection.deleteMany();
  await prisma.productCategory.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.attributeValue.deleteMany();
  await prisma.attribute.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.category.deleteMany();
  await prisma.brand.deleteMany();
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

describe("Pricing integration tests", () => {
  beforeEach(async () => {
    await resetDatabase();
  });
  afterAll(async () => {
    await resetDatabase();
    await prisma.$disconnect();
  });

  async function createVariantScope() {
    const tenant = await prisma.tenant.create({
      data: {
        slug: `tenant-${randomUUID()}`,
        name: "Tenant",
        status: TenantStatus.ACTIVE,
        settings: { create: { defaultLocale: "en", defaultCurrency: "USD" } },
      },
    });
    const store = await prisma.store.create({
      data: {
        tenantId: tenant.id,
        slug: `store-${randomUUID()}`,
        name: "Store",
        settings: { create: { defaultLocale: "en", defaultCurrency: "USD" } },
      },
    });
    const product = await prisma.product.create({
      data: {
        tenantId: tenant.id,
        storeId: store.id,
        slug: "my-product",
        title: "My Product",
      },
    });
    const variant = await prisma.productVariant.create({
      data: { productId: product.id, sku: "SKU-1", title: "Variant 1" },
    });
    return { tenant, store, variant };
  }

  it("persists prices by variant and currency", async () => {
    const { tenant, store, variant } = await createVariantScope();
    const price = await repository.createPrice({
      tenantId: tenant.id,
      storeId: store.id,
      variantId: variant.id,
      currencyCode: "USD",
      amount: 1000,
    });
    const stored = await prisma.price.findUnique({ where: { id: price.id } });
    expect(stored?.amount).toBe(1000);
  });
  it("persists compare-at prices", async () => {
    const { tenant, store, variant } = await createVariantScope();
    const price = await repository.createCompareAtPrice({
      tenantId: tenant.id,
      storeId: store.id,
      variantId: variant.id,
      currencyCode: "USD",
      amount: 1500,
    });
    const stored = await prisma.compareAtPrice.findUnique({
      where: { id: price.id },
    });
    expect(stored?.amount).toBe(1500);
  });
  it("persists scheduled prices", async () => {
    const { tenant, store, variant } = await createVariantScope();
    const price = await repository.createScheduledPrice({
      tenantId: tenant.id,
      storeId: store.id,
      variantId: variant.id,
      currencyCode: "USD",
      amount: 900,
      startsAt: new Date(Date.now() + 1000),
      endsAt: new Date(Date.now() + 2000),
    });
    const stored = await prisma.scheduledPrice.findUnique({
      where: { id: price.id },
    });
    expect(stored?.amount).toBe(900);
  });
});

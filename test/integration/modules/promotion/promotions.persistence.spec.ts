import { randomUUID } from "node:crypto";

import { PrismaClient, TenantStatus } from "@prisma/client";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { PrismaPromotionRepository } from "src/modules/promotion/infrastructure/persistence/prisma-promotion.repository";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url:
        process.env.DATABASE_URL ||
        "postgresql://postgres:postgres@localhost:5432/e_com_backend",
    },
  },
});
const repository = new PrismaPromotionRepository(prisma as any);

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

describe("Promotion integration tests", () => {
  beforeEach(async () => {
    await resetDatabase();
  });
  afterAll(async () => {
    await resetDatabase();
    await prisma.$disconnect();
  });

  async function createStoreScope() {
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
    return { tenant, store };
  }

  it("persists coupons and promotion rules", async () => {
    const { tenant, store } = await createStoreScope();
    const coupon = await repository.createCoupon({
      tenantId: tenant.id,
      storeId: store.id,
      code: "SAVE10",
      type: "FIXED",
      value: 1000,
    });
    const rule = await repository.createPromotionRule({
      tenantId: tenant.id,
      storeId: store.id,
      couponId: coupon.id,
      resource: "cart.total",
      operator: "gte",
      value: "5000",
    });
    const storedCoupon = await prisma.coupon.findUnique({
      where: { id: coupon.id },
    });
    const storedRule = await prisma.promotionRule.findUnique({
      where: { id: rule.id },
    });
    expect(storedCoupon?.code).toBe("SAVE10");
    expect(storedRule?.resource).toBe("cart.total");
  });
  it("persists promotion usages", async () => {
    const { tenant, store } = await createStoreScope();
    const coupon = await repository.createCoupon({
      tenantId: tenant.id,
      storeId: store.id,
      code: "SAVE10",
      type: "FIXED",
      value: 1000,
    });
    const usage = await repository.createPromotionUsage({
      tenantId: tenant.id,
      storeId: store.id,
      couponId: coupon.id,
    });
    const storedUsage = await prisma.promotionUsage.findUnique({
      where: { id: usage.id },
    });
    expect(storedUsage?.couponId).toBe(coupon.id);
  });
  it("enforces unique coupon code within store", async () => {
    const { tenant, store } = await createStoreScope();
    await repository.createCoupon({
      tenantId: tenant.id,
      storeId: store.id,
      code: "SAVE10",
      type: "FIXED",
      value: 1000,
    });
    await expect(
      repository.createCoupon({
        tenantId: tenant.id,
        storeId: store.id,
        code: "SAVE10",
        type: "FIXED",
        value: 1000,
      }),
    ).rejects.toThrow();
  });
});

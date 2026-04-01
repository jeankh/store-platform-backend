import { randomUUID } from "node:crypto";

import { CatalogStatus, PrismaClient, TenantStatus } from "@prisma/client";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { PrismaSearchRepository } from "src/modules/search/infrastructure/persistence/prisma-search.repository";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url:
        process.env.DATABASE_URL ||
        "postgresql://postgres:postgres@localhost:5432/e_com_backend",
    },
  },
});
const repository = new PrismaSearchRepository(prisma as any);

async function resetDatabase() {
  await prisma.lowStockAlert.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.stockAdjustment.deleteMany();
  await prisma.inventoryReservation.deleteMany();
  await prisma.inventoryLevel.deleteMany();
  await prisma.stockItem.deleteMany();
  await prisma.inventoryLocation.deleteMany();
  await prisma.warehouse.deleteMany();
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

describe("Search integration tests", () => {
  beforeEach(async () => {
    await resetDatabase();
  });
  afterAll(async () => {
    await resetDatabase();
    await prisma.$disconnect();
  });

  async function seedCatalog() {
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
    const category = await prisma.category.create({
      data: {
        tenantId: tenant.id,
        storeId: store.id,
        slug: "summer",
        name: "Summer",
      },
    });
    const collection = await prisma.collection.create({
      data: {
        tenantId: tenant.id,
        storeId: store.id,
        slug: "featured",
        name: "Featured",
      },
    });
    const product = await prisma.product.create({
      data: {
        tenantId: tenant.id,
        storeId: store.id,
        slug: "published-product",
        title: "Published Product",
        description: "A product",
        status: CatalogStatus.PUBLISHED,
      },
    });
    await prisma.productCategory.create({
      data: { productId: product.id, categoryId: category.id },
    });
    await prisma.productCollection.create({
      data: { productId: product.id, collectionId: collection.id },
    });
    const variant = await prisma.productVariant.create({
      data: {
        productId: product.id,
        sku: "SKU-1",
        title: "Variant 1",
        status: CatalogStatus.PUBLISHED,
      },
    });
    await prisma.price.create({
      data: {
        tenantId: tenant.id,
        storeId: store.id,
        variantId: variant.id,
        currencyCode: "USD",
        amount: 1000,
      },
    });
    await prisma.product.create({
      data: {
        tenantId: tenant.id,
        storeId: store.id,
        slug: "draft-product",
        title: "Draft Product",
        status: CatalogStatus.DRAFT,
      },
    });
    return { tenant, store };
  }

  it("projects product search documents from catalog records", async () => {
    const { store } = await seedCatalog();
    const result = await repository.searchProducts({
      storeId: store.id,
      page: 1,
      pageSize: 20,
    });
    expect(result.items[0].slug).toBe("published-product");
    expect(result.items[0].defaultPrice?.amount).toBe(1000);
  });

  it("indexes and refreshes search documents", async () => {
    const { store } = await seedCatalog();
    const result = await repository.searchProducts({
      storeId: store.id,
      query: "Published",
      page: 1,
      pageSize: 20,
    });
    expect(result.total).toBe(1);
  });

  it("exposes published products only in search results", async () => {
    const { store } = await seedCatalog();
    const result = await repository.searchProducts({
      storeId: store.id,
      page: 1,
      pageSize: 20,
    });
    expect(result.items).toHaveLength(1);
    expect(result.items[0].status).toBe("PUBLISHED");
  });
});

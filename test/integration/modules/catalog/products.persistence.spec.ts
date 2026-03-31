import { randomUUID } from "node:crypto";

import { PrismaClient, TenantStatus } from "@prisma/client";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { PrismaCatalogRepository } from "src/modules/catalog/infrastructure/persistence/prisma-catalog.repository";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url:
        process.env.DATABASE_URL ||
        "postgresql://postgres:postgres@localhost:5432/e_com_backend",
    },
  },
});
const repository = new PrismaCatalogRepository(prisma as any);

async function resetDatabase() {
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

describe("Catalog products integration tests", () => {
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

  it("persists product records", async () => {
    const { tenant, store } = await createStoreScope();
    const product = await repository.createProduct({
      tenantId: tenant.id,
      storeId: store.id,
      slug: "my-product",
      title: "My Product",
    });
    const stored = await prisma.product.findUnique({
      where: { id: product.id },
    });
    expect(stored?.title).toBe("My Product");
  });

  it("persists product variants", async () => {
    const { tenant, store } = await createStoreScope();
    const product = await repository.createProduct({
      tenantId: tenant.id,
      storeId: store.id,
      slug: "my-product",
      title: "My Product",
    });
    const variant = await repository.createVariant({
      productId: product.id,
      sku: "SKU-1",
      title: "Variant 1",
    });
    const stored = await prisma.productVariant.findUnique({
      where: { id: variant.id },
    });
    expect(stored?.sku).toBe("SKU-1");
  });

  it("enforces unique store_id and slug for products", async () => {
    const { tenant, store } = await createStoreScope();
    await repository.createProduct({
      tenantId: tenant.id,
      storeId: store.id,
      slug: "my-product",
      title: "My Product",
    });
    await expect(
      repository.createProduct({
        tenantId: tenant.id,
        storeId: store.id,
        slug: "my-product",
        title: "Other Product",
      }),
    ).rejects.toThrow();
  });

  it("enforces unique product_id and sku for variants", async () => {
    const { tenant, store } = await createStoreScope();
    const product = await repository.createProduct({
      tenantId: tenant.id,
      storeId: store.id,
      slug: "my-product",
      title: "My Product",
    });
    await repository.createVariant({
      productId: product.id,
      sku: "SKU-1",
      title: "Variant 1",
    });
    await expect(
      repository.createVariant({
        productId: product.id,
        sku: "SKU-1",
        title: "Variant 2",
      }),
    ).rejects.toThrow();
  });
});

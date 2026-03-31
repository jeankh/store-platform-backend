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

describe("Catalog taxonomy integration tests", () => {
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

  it("persists categories and parent-child links", async () => {
    const { tenant, store } = await createStoreScope();
    const parent = await repository.createCategory({
      tenantId: tenant.id,
      storeId: store.id,
      slug: "parent",
      name: "Parent",
    });
    const child = await repository.createCategory({
      tenantId: tenant.id,
      storeId: store.id,
      slug: "child",
      name: "Child",
      parentId: parent.id,
    });
    const stored = await prisma.category.findUnique({
      where: { id: child.id },
    });
    expect(stored?.parentId).toBe(parent.id);
  });
  it("persists collections and product-collection links", async () => {
    const { tenant, store } = await createStoreScope();
    const product = await repository.createProduct({
      tenantId: tenant.id,
      storeId: store.id,
      slug: "my-product",
      title: "My Product",
    });
    const collection = await repository.createCollection({
      tenantId: tenant.id,
      storeId: store.id,
      slug: "summer",
      name: "Summer",
    });
    await repository.attachProductToCollection({
      productId: product.id,
      collectionId: collection.id,
    });
    const link = await prisma.productCollection.findFirst({
      where: { productId: product.id, collectionId: collection.id },
    });
    expect(link).not.toBeNull();
  });
  it("persists brands tags and attribute structures", async () => {
    const { tenant, store } = await createStoreScope();
    const brand = await prisma.brand.create({
      data: {
        tenantId: tenant.id,
        storeId: store.id,
        slug: "brand-a",
        name: "Brand A",
      },
    });
    const tag = await prisma.tag.create({
      data: { tenantId: tenant.id, storeId: store.id, value: "featured" },
    });
    const attribute = await prisma.attribute.create({
      data: {
        tenantId: tenant.id,
        storeId: store.id,
        name: "Color",
        code: "color",
      },
    });
    const value = await prisma.attributeValue.create({
      data: { attributeId: attribute.id, value: "Red" },
    });
    expect(brand.slug).toBe("brand-a");
    expect(tag.value).toBe("featured");
    expect(value.value).toBe("Red");
  });
  it("enforces scoped uniqueness rules for taxonomy entities", async () => {
    const { tenant, store } = await createStoreScope();
    await repository.createCategory({
      tenantId: tenant.id,
      storeId: store.id,
      slug: "summer",
      name: "Summer",
    });
    await expect(
      repository.createCategory({
        tenantId: tenant.id,
        storeId: store.id,
        slug: "summer",
        name: "Summer 2",
      }),
    ).rejects.toThrow();
  });
});

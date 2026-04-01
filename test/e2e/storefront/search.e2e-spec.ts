import { randomUUID } from "node:crypto";

import { CatalogStatus, PrismaClient, TenantStatus } from "@prisma/client";
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { configureApplication } from "src/bootstrap/app-bootstrap";
import { AppModule } from "src/app.module";

process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/e_com_backend";
const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

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

describe("Storefront search e2e tests", () => {
  let app: INestApplication;
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApplication(app);
    await app.init();
  });
  beforeEach(async () => {
    await resetDatabase();
  });
  afterAll(async () => {
    await resetDatabase();
    if (app) await app.close();
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
        slug: "storefront-default",
        name: "Storefront Default",
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
        description: "Red summer shoe",
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
        description: "Hidden",
        status: CatalogStatus.DRAFT,
      },
    });
    return { tenant, store, category, collection };
  }

  it("GET /api/storefront/search/products returns published products by keyword", async () => {
    const { store } = await seedCatalog();
    const response = await request(app.getHttpServer())
      .get(`/api/storefront/search/products?storeId=${store.id}&query=summer`)
      .expect(200);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0].slug).toBe("published-product");
  });

  it("supports category and collection filters", async () => {
    const { store } = await seedCatalog();
    const response = await request(app.getHttpServer())
      .get(
        `/api/storefront/search/products?storeId=${store.id}&category=summer&collection=featured`,
      )
      .expect(200);
    expect(response.body.items).toHaveLength(1);
  });

  it("supports sorting and pagination defaults", async () => {
    const { store } = await seedCatalog();
    const response = await request(app.getHttpServer())
      .get(`/api/storefront/search/products?storeId=${store.id}`)
      .expect(200);
    expect(response.body.page).toBe(1);
    expect(response.body.pageSize).toBe(20);
  });
});

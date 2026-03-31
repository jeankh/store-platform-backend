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

describe("Storefront catalog e2e tests", () => {
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
    const published = await prisma.product.create({
      data: {
        tenantId: tenant.id,
        storeId: store.id,
        slug: "published-product",
        title: "Published Product",
        status: CatalogStatus.PUBLISHED,
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
    await prisma.category.create({
      data: {
        tenantId: tenant.id,
        storeId: store.id,
        slug: "summer",
        name: "Summer",
      },
    });
    await prisma.collection.create({
      data: {
        tenantId: tenant.id,
        storeId: store.id,
        slug: "featured",
        name: "Featured",
      },
    });
    return { tenant, store, published };
  }

  it("GET /api/storefront/products lists published products only", async () => {
    const { store } = await seedCatalog();
    const response = await request(app.getHttpServer())
      .get(`/api/storefront/products?storeId=${store.id}`)
      .expect(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].slug).toBe("published-product");
  });
  it("GET /api/storefront/products/:productSlug returns product detail by slug", async () => {
    const { store, published } = await seedCatalog();
    const response = await request(app.getHttpServer())
      .get(`/api/storefront/products/${published.slug}?storeId=${store.id}`)
      .expect(200);
    expect(response.body.id).toBe(published.id);
  });
  it("GET /api/storefront/categories returns storefront categories", async () => {
    const { tenant } = await seedCatalog();
    const response = await request(app.getHttpServer())
      .get(`/api/storefront/categories?tenantId=${tenant.id}`)
      .expect(200);
    expect(response.body).toHaveLength(1);
  });
  it("GET /api/storefront/collections returns storefront collections", async () => {
    const { tenant } = await seedCatalog();
    const response = await request(app.getHttpServer())
      .get(`/api/storefront/collections?tenantId=${tenant.id}`)
      .expect(200);
    expect(response.body).toHaveLength(1);
  });
});

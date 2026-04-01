import { randomUUID } from "node:crypto";

import { PrismaClient, TenantStatus } from "@prisma/client";
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

describe("Admin pricing e2e tests", () => {
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

  async function bootstrapOwnerAndVariant() {
    const tenant = await prisma.tenant.create({
      data: {
        slug: `tenant-${randomUUID()}`,
        name: "Tenant",
        status: TenantStatus.ACTIVE,
        settings: { create: { defaultLocale: "en", defaultCurrency: "USD" } },
      },
    });
    const auth = await request(app.getHttpServer())
      .post("/api/admin/auth/bootstrap")
      .send({
        tenantId: tenant.id,
        email: "owner@tenant.test",
        password: "super-secret-password",
        firstName: "Owner",
        lastName: "User",
      });
    const store = await request(app.getHttpServer())
      .post(`/api/admin/tenants/${tenant.id}/stores`)
      .set("Authorization", `Bearer ${auth.body.accessToken}`)
      .send({ slug: "main-store", name: "Main Store" });
    const product = await request(app.getHttpServer())
      .post("/api/admin/products")
      .set("Authorization", `Bearer ${auth.body.accessToken}`)
      .send({
        tenantId: tenant.id,
        storeId: store.body.id,
        slug: "my-product",
        title: "My Product",
      });
    const variant = await request(app.getHttpServer())
      .post(`/api/admin/products/${product.body.id}/variants`)
      .set("Authorization", `Bearer ${auth.body.accessToken}`)
      .send({ sku: "SKU-1", title: "Variant 1" });
    return {
      token: auth.body.accessToken as string,
      variantId: variant.body.id,
    };
  }

  it("POST /api/admin/variants/:variantId/prices creates a base price", async () => {
    const { token, variantId } = await bootstrapOwnerAndVariant();
    const response = await request(app.getHttpServer())
      .post(`/api/admin/variants/${variantId}/prices`)
      .set("Authorization", `Bearer ${token}`)
      .send({ currencyCode: "USD", amount: 1000 })
      .expect(201);
    expect(response.body.amount).toBe(1000);
  });
  it("GET /api/admin/variants/:variantId/prices lists variant prices", async () => {
    const { token, variantId } = await bootstrapOwnerAndVariant();
    await request(app.getHttpServer())
      .post(`/api/admin/variants/${variantId}/prices`)
      .set("Authorization", `Bearer ${token}`)
      .send({ currencyCode: "USD", amount: 1000 });
    const response = await request(app.getHttpServer())
      .get(`/api/admin/variants/${variantId}/prices`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(response.body).toHaveLength(1);
  });
  it("PATCH /api/admin/prices/:priceId updates a price", async () => {
    const { token, variantId } = await bootstrapOwnerAndVariant();
    const created = await request(app.getHttpServer())
      .post(`/api/admin/variants/${variantId}/prices`)
      .set("Authorization", `Bearer ${token}`)
      .send({ currencyCode: "USD", amount: 1000 });
    const response = await request(app.getHttpServer())
      .patch(`/api/admin/prices/${created.body.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 1200 })
      .expect(200);
    expect(response.body.amount).toBe(1200);
  });
});

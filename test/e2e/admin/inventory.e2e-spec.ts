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

describe("Admin inventory e2e tests", () => {
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
      tenant,
      storeId: store.body.id,
      variantId: variant.body.id,
      token: auth.body.accessToken as string,
    };
  }

  it("POST /api/admin/warehouses creates a warehouse", async () => {
    const { tenant, storeId, token } = await bootstrapOwnerAndVariant();
    const response = await request(app.getHttpServer())
      .post("/api/admin/warehouses")
      .set("Authorization", `Bearer ${token}`)
      .send({
        tenantId: tenant.id,
        storeId,
        slug: "main-warehouse",
        name: "Main Warehouse",
      })
      .expect(201);
    expect(response.body.slug).toBe("main-warehouse");
  });
  it("GET /api/admin/warehouses lists warehouses", async () => {
    const { tenant, storeId, token } = await bootstrapOwnerAndVariant();
    await request(app.getHttpServer())
      .post("/api/admin/warehouses")
      .set("Authorization", `Bearer ${token}`)
      .send({
        tenantId: tenant.id,
        storeId,
        slug: "main-warehouse",
        name: "Main Warehouse",
      });
    const response = await request(app.getHttpServer())
      .get("/api/admin/warehouses")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(response.body).toHaveLength(1);
  });
  it("POST /api/admin/locations creates a location", async () => {
    const { tenant, storeId, token } = await bootstrapOwnerAndVariant();
    const warehouse = await request(app.getHttpServer())
      .post("/api/admin/warehouses")
      .set("Authorization", `Bearer ${token}`)
      .send({
        tenantId: tenant.id,
        storeId,
        slug: "main-warehouse",
        name: "Main Warehouse",
      });
    const response = await request(app.getHttpServer())
      .post("/api/admin/locations")
      .set("Authorization", `Bearer ${token}`)
      .send({
        tenantId: tenant.id,
        storeId,
        warehouseId: warehouse.body.id,
        slug: "main-location",
        name: "Main Location",
      })
      .expect(201);
    expect(response.body.slug).toBe("main-location");
  });
  it("GET /api/admin/locations lists locations", async () => {
    const { tenant, storeId, token } = await bootstrapOwnerAndVariant();
    const warehouse = await request(app.getHttpServer())
      .post("/api/admin/warehouses")
      .set("Authorization", `Bearer ${token}`)
      .send({
        tenantId: tenant.id,
        storeId,
        slug: "main-warehouse",
        name: "Main Warehouse",
      });
    await request(app.getHttpServer())
      .post("/api/admin/locations")
      .set("Authorization", `Bearer ${token}`)
      .send({
        tenantId: tenant.id,
        storeId,
        warehouseId: warehouse.body.id,
        slug: "main-location",
        name: "Main Location",
      });
    const response = await request(app.getHttpServer())
      .get("/api/admin/locations")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(response.body).toHaveLength(1);
  });
  it("POST /api/admin/variants/:variantId/stock-levels creates stock level", async () => {
    const { tenant, storeId, variantId, token } =
      await bootstrapOwnerAndVariant();
    const warehouse = await request(app.getHttpServer())
      .post("/api/admin/warehouses")
      .set("Authorization", `Bearer ${token}`)
      .send({
        tenantId: tenant.id,
        storeId,
        slug: "main-warehouse",
        name: "Main Warehouse",
      });
    const location = await request(app.getHttpServer())
      .post("/api/admin/locations")
      .set("Authorization", `Bearer ${token}`)
      .send({
        tenantId: tenant.id,
        storeId,
        warehouseId: warehouse.body.id,
        slug: "main-location",
        name: "Main Location",
      });
    const response = await request(app.getHttpServer())
      .post(`/api/admin/variants/${variantId}/stock-levels`)
      .set("Authorization", `Bearer ${token}`)
      .send({ locationId: location.body.id, availableQuantity: 10 })
      .expect(201);
    expect(response.body.availableQuantity).toBe(10);
  });
  it("GET /api/admin/variants/:variantId/stock-levels lists stock levels", async () => {
    const { tenant, storeId, variantId, token } =
      await bootstrapOwnerAndVariant();
    const warehouse = await request(app.getHttpServer())
      .post("/api/admin/warehouses")
      .set("Authorization", `Bearer ${token}`)
      .send({
        tenantId: tenant.id,
        storeId,
        slug: "main-warehouse",
        name: "Main Warehouse",
      });
    const location = await request(app.getHttpServer())
      .post("/api/admin/locations")
      .set("Authorization", `Bearer ${token}`)
      .send({
        tenantId: tenant.id,
        storeId,
        warehouseId: warehouse.body.id,
        slug: "main-location",
        name: "Main Location",
      });
    await request(app.getHttpServer())
      .post(`/api/admin/variants/${variantId}/stock-levels`)
      .set("Authorization", `Bearer ${token}`)
      .send({ locationId: location.body.id, availableQuantity: 10 });
    const response = await request(app.getHttpServer())
      .get(`/api/admin/variants/${variantId}/stock-levels`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(response.body).toHaveLength(1);
  });
  it("POST /api/admin/variants/:variantId/stock-adjustments creates adjustment", async () => {
    const { tenant, storeId, variantId, token } =
      await bootstrapOwnerAndVariant();
    const warehouse = await request(app.getHttpServer())
      .post("/api/admin/warehouses")
      .set("Authorization", `Bearer ${token}`)
      .send({
        tenantId: tenant.id,
        storeId,
        slug: "main-warehouse",
        name: "Main Warehouse",
      });
    const location = await request(app.getHttpServer())
      .post("/api/admin/locations")
      .set("Authorization", `Bearer ${token}`)
      .send({
        tenantId: tenant.id,
        storeId,
        warehouseId: warehouse.body.id,
        slug: "main-location",
        name: "Main Location",
      });
    await request(app.getHttpServer())
      .post(`/api/admin/variants/${variantId}/stock-levels`)
      .set("Authorization", `Bearer ${token}`)
      .send({ locationId: location.body.id, availableQuantity: 10 });
    const response = await request(app.getHttpServer())
      .post(`/api/admin/variants/${variantId}/stock-adjustments`)
      .set("Authorization", `Bearer ${token}`)
      .send({ locationId: location.body.id, delta: -2, reason: "manual" })
      .expect(201);
    expect(response.body.delta).toBe(-2);
  });
  it("GET /api/admin/variants/:variantId/stock-movements lists stock movements", async () => {
    const { tenant, storeId, variantId, token } =
      await bootstrapOwnerAndVariant();
    const warehouse = await request(app.getHttpServer())
      .post("/api/admin/warehouses")
      .set("Authorization", `Bearer ${token}`)
      .send({
        tenantId: tenant.id,
        storeId,
        slug: "main-warehouse",
        name: "Main Warehouse",
      });
    const location = await request(app.getHttpServer())
      .post("/api/admin/locations")
      .set("Authorization", `Bearer ${token}`)
      .send({
        tenantId: tenant.id,
        storeId,
        warehouseId: warehouse.body.id,
        slug: "main-location",
        name: "Main Location",
      });
    await request(app.getHttpServer())
      .post(`/api/admin/variants/${variantId}/stock-levels`)
      .set("Authorization", `Bearer ${token}`)
      .send({ locationId: location.body.id, availableQuantity: 10 });
    await request(app.getHttpServer())
      .post(`/api/admin/variants/${variantId}/stock-adjustments`)
      .set("Authorization", `Bearer ${token}`)
      .send({ locationId: location.body.id, delta: -2, reason: "manual" });
    const response = await request(app.getHttpServer())
      .get(`/api/admin/variants/${variantId}/stock-movements`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(response.body.length).toBeGreaterThan(0);
  });
  it("GET /api/admin/low-stock-alerts lists low-stock alerts", async () => {
    const { token } = await bootstrapOwnerAndVariant();
    const response = await request(app.getHttpServer())
      .get("/api/admin/low-stock-alerts")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});

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
  await prisma.trackingEvent.deleteMany();
  await prisma.shipmentItem.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.shippingMethod.deleteMany();
  await prisma.shippingZone.deleteMany();
  await prisma.paymentWebhookEvent.deleteMany();
  await prisma.paymentRefund.deleteMany();
  await prisma.paymentCapture.deleteMany();
  await prisma.paymentTransaction.deleteMany();
  await prisma.paymentIntent.deleteMany();
  await prisma.orderNote.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.orderAddress.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.checkoutTax.deleteMany();
  await prisma.checkoutDiscount.deleteMany();
  await prisma.checkoutShippingMethod.deleteMany();
  await prisma.checkoutAddress.deleteMany();
  await prisma.checkoutItem.deleteMany();
  await prisma.checkout.deleteMany();
  await prisma.cartTotal.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
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

describe("Admin shipping e2e tests", () => {
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

  async function bootstrapOwnerAndOrder() {
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
    const product = await prisma.product.create({
      data: {
        tenantId: tenant.id,
        storeId: store.body.id,
        slug: "my-product",
        title: "My Product",
        status: CatalogStatus.PUBLISHED,
      },
    });
    const variant = await prisma.productVariant.create({
      data: {
        productId: product.id,
        sku: "SKU-1",
        title: "Variant 1",
        status: CatalogStatus.PUBLISHED,
      },
    });
    const order = await prisma.order.create({
      data: {
        tenantId: tenant.id,
        storeId: store.body.id,
        checkoutId: (
          await prisma.checkout.create({
            data: {
              tenantId: tenant.id,
              storeId: store.body.id,
              cartId: (
                await prisma.cart.create({
                  data: {
                    tenantId: tenant.id,
                    storeId: store.body.id,
                    guestToken: "guest",
                  },
                })
              ).id,
            },
          })
        ).id,
        customerId: null,
        status: "PENDING",
        currencyCode: "USD",
        subtotalAmount: 2000,
        discountAmount: 0,
        taxAmount: 0,
        totalAmount: 2000,
      },
    });
    await prisma.orderItem.create({
      data: {
        orderId: order.id,
        variantId: variant.id,
        quantity: 2,
        unitAmountSnapshot: 1000,
        currencyCode: "USD",
      },
    });
    const zone = await request(app.getHttpServer())
      .post("/api/admin/shipping-zones")
      .set("Authorization", `Bearer ${auth.body.accessToken}`)
      .send({
        tenantId: tenant.id,
        storeId: store.body.id,
        name: "France",
        countryCode: "FR",
      });
    const method = await request(app.getHttpServer())
      .post("/api/admin/shipping-methods")
      .set("Authorization", `Bearer ${auth.body.accessToken}`)
      .send({
        tenantId: tenant.id,
        storeId: store.body.id,
        shippingZoneId: zone.body.id,
        code: "standard",
        name: "Standard",
        amount: 500,
        currencyCode: "USD",
      });
    return {
      tenant,
      storeId: store.body.id,
      orderId: order.id,
      shippingMethodId: method.body.id,
      token: auth.body.accessToken as string,
    };
  }

  it("POST /api/admin/shipping-zones", async () => {
    const { tenant, storeId, token } = await bootstrapOwnerAndOrder();
    const response = await request(app.getHttpServer())
      .post("/api/admin/shipping-zones")
      .set("Authorization", `Bearer ${token}`)
      .send({ tenantId: tenant.id, storeId, name: "France", countryCode: "FR" })
      .expect(201);
    expect(response.body.countryCode).toBe("FR");
  });

  it("GET /api/admin/shipping-zones", async () => {
    const { tenant, storeId, token } = await bootstrapOwnerAndOrder();
    await request(app.getHttpServer())
      .post("/api/admin/shipping-zones")
      .set("Authorization", `Bearer ${token}`)
      .send({
        tenantId: tenant.id,
        storeId,
        name: "France",
        countryCode: "FR",
      });
    const response = await request(app.getHttpServer())
      .get("/api/admin/shipping-zones")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(response.body).toHaveLength(1);
  });

  it("POST /api/admin/shipping-methods", async () => {
    const { tenant, storeId, token } = await bootstrapOwnerAndOrder();
    const zone = await request(app.getHttpServer())
      .post("/api/admin/shipping-zones")
      .set("Authorization", `Bearer ${token}`)
      .send({
        tenantId: tenant.id,
        storeId,
        name: "France",
        countryCode: "FR",
      });
    const response = await request(app.getHttpServer())
      .post("/api/admin/shipping-methods")
      .set("Authorization", `Bearer ${token}`)
      .send({
        tenantId: tenant.id,
        storeId,
        shippingZoneId: zone.body.id,
        code: "standard",
        name: "Standard",
        amount: 500,
        currencyCode: "USD",
      })
      .expect(201);
    expect(response.body.code).toBe("standard");
  });

  it("GET /api/admin/shipping-methods", async () => {
    const { tenant, storeId, token } = await bootstrapOwnerAndOrder();
    const zone = await request(app.getHttpServer())
      .post("/api/admin/shipping-zones")
      .set("Authorization", `Bearer ${token}`)
      .send({
        tenantId: tenant.id,
        storeId,
        name: "France",
        countryCode: "FR",
      });
    await request(app.getHttpServer())
      .post("/api/admin/shipping-methods")
      .set("Authorization", `Bearer ${token}`)
      .send({
        tenantId: tenant.id,
        storeId,
        shippingZoneId: zone.body.id,
        code: "standard",
        name: "Standard",
        amount: 500,
        currencyCode: "USD",
      });
    const response = await request(app.getHttpServer())
      .get("/api/admin/shipping-methods")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(response.body).toHaveLength(1);
  });

  it("POST /api/admin/orders/:orderId/shipments", async () => {
    const { token, orderId, shippingMethodId } = await bootstrapOwnerAndOrder();
    const response = await request(app.getHttpServer())
      .post(`/api/admin/orders/${orderId}/shipments`)
      .set("Authorization", `Bearer ${token}`)
      .send({ shippingMethodId, trackingNumber: "TRACK-1" })
      .expect(201);
    expect(response.body.orderId).toBe(orderId);
  });
  it("GET /api/admin/orders/:orderId/shipments", async () => {
    const { token, orderId, shippingMethodId } = await bootstrapOwnerAndOrder();
    await request(app.getHttpServer())
      .post(`/api/admin/orders/${orderId}/shipments`)
      .set("Authorization", `Bearer ${token}`)
      .send({ shippingMethodId });
    const response = await request(app.getHttpServer())
      .get(`/api/admin/orders/${orderId}/shipments`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(response.body.length).toBe(1);
  });
  it("POST /api/admin/shipments/:shipmentId/tracking-events", async () => {
    const { token, orderId, shippingMethodId } = await bootstrapOwnerAndOrder();
    const shipment = await request(app.getHttpServer())
      .post(`/api/admin/orders/${orderId}/shipments`)
      .set("Authorization", `Bearer ${token}`)
      .send({ shippingMethodId });
    const response = await request(app.getHttpServer())
      .post(`/api/admin/shipments/${shipment.body.id}/tracking-events`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "shipped", description: "Left warehouse" })
      .expect(201);
    expect(response.body.status).toBe("shipped");
  });
});

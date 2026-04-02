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

describe("Admin payments e2e tests", () => {
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

  async function setupPaymentIntent() {
    const tenant = await prisma.tenant.create({
      data: {
        slug: `tenant-${randomUUID()}`,
        name: "Tenant",
        status: TenantStatus.ACTIVE,
        settings: { create: { defaultLocale: "en", defaultCurrency: "USD" } },
      },
    });
    const admin = await request(app.getHttpServer())
      .post("/api/admin/auth/bootstrap")
      .send({
        tenantId: tenant.id,
        email: "owner@tenant.test",
        password: "super-secret-password",
        firstName: "Owner",
        lastName: "User",
      });
    const customer = await request(app.getHttpServer())
      .post("/api/storefront/auth/register")
      .send({
        tenantId: tenant.id,
        email: "customer@test.com",
        password: "super-secret-password",
        firstName: "John",
        lastName: "Doe",
      });
    const store = await prisma.store.create({
      data: {
        tenantId: tenant.id,
        slug: `store-${randomUUID()}`,
        name: "Store",
        settings: { create: { defaultLocale: "en", defaultCurrency: "USD" } },
      },
    });
    const cart = await prisma.cart.create({
      data: {
        tenantId: tenant.id,
        storeId: store.id,
        customerId: customer.body.customer.id,
      },
    });
    const checkout = await prisma.checkout.create({
      data: {
        tenantId: tenant.id,
        storeId: store.id,
        cartId: cart.id,
        customerId: customer.body.customer.id,
      },
    });
    const order = await prisma.order.create({
      data: {
        tenantId: tenant.id,
        storeId: store.id,
        checkoutId: checkout.id,
        customerId: customer.body.customer.id,
        status: "PENDING",
        currencyCode: "USD",
        subtotalAmount: 2000,
        discountAmount: 0,
        taxAmount: 0,
        totalAmount: 2000,
      },
    });
    const payment = await request(app.getHttpServer())
      .post(`/api/storefront/orders/${order.id}/payment-intents`)
      .set("Authorization", `Bearer ${customer.body.accessToken}`)
      .send({ provider: "manual" });
    return {
      adminToken: admin.body.accessToken as string,
      paymentIntentId: payment.body.paymentIntent.id,
    };
  }

  it("GET /api/admin/payments lists payments", async () => {
    const { adminToken } = await setupPaymentIntent();
    const response = await request(app.getHttpServer())
      .get("/api/admin/payments")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    expect(response.body.length).toBe(1);
  });

  it("GET /api/admin/payments/:paymentIntentId returns payment", async () => {
    const { adminToken, paymentIntentId } = await setupPaymentIntent();
    const response = await request(app.getHttpServer())
      .get(`/api/admin/payments/${paymentIntentId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    expect(response.body.paymentIntent.id).toBe(paymentIntentId);
  });

  it("POST /api/admin/payments/:paymentIntentId/capture", async () => {
    const { adminToken, paymentIntentId } = await setupPaymentIntent();
    const response = await request(app.getHttpServer())
      .post(`/api/admin/payments/${paymentIntentId}/capture`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ amount: 1000 })
      .expect(201);
    expect(response.body.paymentIntent.status).toBe("CAPTURED");
  });

  it("POST /api/admin/payments/:paymentIntentId/refunds", async () => {
    const { adminToken, paymentIntentId } = await setupPaymentIntent();
    const response = await request(app.getHttpServer())
      .post(`/api/admin/payments/${paymentIntentId}/refunds`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ amount: 500, reason: "requested" })
      .expect(201);
    expect(response.body.paymentIntent.status).toBe("REFUNDED");
  });
});

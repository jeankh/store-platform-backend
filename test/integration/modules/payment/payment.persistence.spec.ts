import { randomUUID } from "node:crypto";

import { PrismaClient, TenantStatus } from "@prisma/client";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { PrismaPaymentRepository } from "src/modules/payment/infrastructure/persistence/prisma-payment.repository";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url:
        process.env.DATABASE_URL ||
        "postgresql://postgres:postgres@localhost:5432/e_com_backend",
    },
  },
});
const repository = new PrismaPaymentRepository(prisma as any);

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

describe("Payment integration tests", () => {
  beforeEach(async () => {
    await resetDatabase();
  });
  afterAll(async () => {
    await resetDatabase();
    await prisma.$disconnect();
  });

  async function createOrderScope() {
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
    const customer = await prisma.customer.create({
      data: {
        tenantId: tenant.id,
        email: "customer@test.com",
        firstName: "John",
        lastName: "Doe",
        preferences: { create: {} },
      },
    });
    const checkout = await prisma.checkout.create({
      data: {
        tenantId: tenant.id,
        storeId: store.id,
        cartId: (
          await prisma.cart.create({
            data: {
              tenantId: tenant.id,
              storeId: store.id,
              customerId: customer.id,
            },
          })
        ).id,
        customerId: customer.id,
      },
    });
    const order = await prisma.order.create({
      data: {
        tenantId: tenant.id,
        storeId: store.id,
        checkoutId: checkout.id,
        customerId: customer.id,
        status: "PENDING",
        currencyCode: "USD",
        subtotalAmount: 2000,
        discountAmount: 0,
        taxAmount: 0,
        totalAmount: 2000,
      },
    });
    return { tenant, store, order };
  }

  it("persists payment intents and transactions", async () => {
    const { tenant, store, order } = await createOrderScope();
    const intent = await repository.createPaymentIntent({
      tenantId: tenant.id,
      storeId: store.id,
      orderId: order.id,
      provider: "manual",
      currencyCode: "USD",
      amount: 2000,
    });
    await repository.createPaymentTransaction({
      paymentIntentId: intent.id,
      type: "AUTHORIZATION",
      status: "PENDING",
      amount: 2000,
    });
    const storedIntent = await prisma.paymentIntent.findUnique({
      where: { id: intent.id },
    });
    const transactions = await prisma.paymentTransaction.findMany({
      where: { paymentIntentId: intent.id },
    });
    expect(storedIntent?.amount).toBe(2000);
    expect(transactions).toHaveLength(1);
  });

  it("persists captures and refunds", async () => {
    const { tenant, store, order } = await createOrderScope();
    const intent = await repository.createPaymentIntent({
      tenantId: tenant.id,
      storeId: store.id,
      orderId: order.id,
      provider: "manual",
      currencyCode: "USD",
      amount: 2000,
    });
    const capture = await repository.createPaymentCapture({
      paymentIntentId: intent.id,
      amount: 1000,
    });
    const refund = await repository.createPaymentRefund({
      paymentIntentId: intent.id,
      amount: 500,
      reason: "requested",
    });
    const storedCapture = await prisma.paymentCapture.findUnique({
      where: { id: capture.id },
    });
    const storedRefund = await prisma.paymentRefund.findUnique({
      where: { id: refund.id },
    });
    expect(storedCapture?.amount).toBe(1000);
    expect(storedRefund?.reason).toBe("requested");
  });

  it("persists webhook event records", async () => {
    const event = await repository.createPaymentWebhookEvent({
      provider: "manual",
      eventType: "payment.updated",
      providerReference: "ref-1",
      payload: { ok: true },
      tenantId: null,
    });
    const storedEvent = await prisma.paymentWebhookEvent.findUnique({
      where: { id: event.id },
    });
    expect(storedEvent?.eventType).toBe("payment.updated");
    expect(storedEvent?.providerReference).toBe("ref-1");
  });
});

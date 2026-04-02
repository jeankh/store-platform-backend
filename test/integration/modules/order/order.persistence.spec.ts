import { randomUUID } from "node:crypto";

import { CatalogStatus, PrismaClient, TenantStatus } from "@prisma/client";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { PrismaOrderRepository } from "src/modules/order/infrastructure/persistence/prisma-order.repository";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url:
        process.env.DATABASE_URL ||
        "postgresql://postgres:postgres@localhost:5432/e_com_backend",
    },
  },
});
const repository = new PrismaOrderRepository(prisma as any);

async function resetDatabase() {
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

describe("Order integration tests", () => {
  beforeEach(async () => {
    await resetDatabase();
  });
  afterAll(async () => {
    await resetDatabase();
    await prisma.$disconnect();
  });

  async function createCheckoutScope() {
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
    const product = await prisma.product.create({
      data: {
        tenantId: tenant.id,
        storeId: store.id,
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
              guestToken: null,
            },
          })
        ).id,
        customerId: customer.id,
      },
    });
    await prisma.checkoutItem.create({
      data: {
        checkoutId: checkout.id,
        variantId: variant.id,
        quantity: 2,
        unitAmountSnapshot: 1000,
        currencyCode: "USD",
      },
    });
    await prisma.checkoutAddress.create({
      data: {
        checkoutId: checkout.id,
        type: "shipping",
        firstName: "John",
        lastName: "Doe",
        line1: "123 Street",
        city: "Paris",
        postalCode: "75001",
        countryCode: "FR",
      },
    });
    return { checkout, customer, variant };
  }

  it("persists orders and order items", async () => {
    const { checkout, customer, variant } = await createCheckoutScope();
    const order = await repository.createOrder({
      tenantId: checkout.tenantId,
      storeId: checkout.storeId,
      checkoutId: checkout.id,
      customerId: customer.id,
      currencyCode: "USD",
      subtotalAmount: 2000,
      discountAmount: 0,
      taxAmount: 0,
      totalAmount: 2000,
    });
    const items = await repository.createOrderItems(order.id, [
      {
        variantId: variant.id,
        quantity: 2,
        unitAmountSnapshot: 1000,
        currencyCode: "USD",
      },
    ]);
    const storedOrder = await prisma.order.findUnique({
      where: { id: order.id },
    });
    expect(storedOrder?.checkoutId).toBe(checkout.id);
    expect(items).toHaveLength(1);
  });

  it("persists order addresses and status history", async () => {
    const { checkout, customer } = await createCheckoutScope();
    const order = await repository.createOrder({
      tenantId: checkout.tenantId,
      storeId: checkout.storeId,
      checkoutId: checkout.id,
      customerId: customer.id,
      currencyCode: "USD",
      subtotalAmount: 2000,
      discountAmount: 0,
      taxAmount: 0,
      totalAmount: 2000,
    });
    await repository.createOrderAddresses(order.id, [
      {
        type: "shipping",
        firstName: "John",
        lastName: "Doe",
        line1: "123 Street",
        line2: null,
        city: "Paris",
        region: null,
        postalCode: "75001",
        countryCode: "FR",
        phone: null,
      },
    ]);
    await repository.createStatusHistory({
      orderId: order.id,
      fromStatus: null,
      toStatus: "PENDING",
    });
    const address = await prisma.orderAddress.findFirst({
      where: { orderId: order.id },
    });
    const history = await prisma.orderStatusHistory.findFirst({
      where: { orderId: order.id },
    });
    expect(address?.city).toBe("Paris");
    expect(history?.toStatus).toBe("PENDING");
  });

  it("persists order notes", async () => {
    const { checkout, customer } = await createCheckoutScope();
    const author = await prisma.user.create({
      data: {
        tenantId: checkout.tenantId,
        email: "admin@test.com",
        passwordHash: "hash",
        status: "ACTIVE",
      },
    });
    const order = await repository.createOrder({
      tenantId: checkout.tenantId,
      storeId: checkout.storeId,
      checkoutId: checkout.id,
      customerId: customer.id,
      currencyCode: "USD",
      subtotalAmount: 2000,
      discountAmount: 0,
      taxAmount: 0,
      totalAmount: 2000,
    });
    await repository.createOrderNote({
      orderId: order.id,
      authorUserId: author.id,
      content: "Packed and ready",
    });
    const note = await prisma.orderNote.findFirst({
      where: { orderId: order.id },
    });
    expect(note?.content).toBe("Packed and ready");
  });
});

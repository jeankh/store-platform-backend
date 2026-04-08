import { randomUUID } from "node:crypto";

import { CatalogStatus, PrismaClient, TenantStatus } from "@prisma/client";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { PrismaShippingRepository } from "src/modules/shipping/infrastructure/persistence/prisma-shipping.repository";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url:
        process.env.DATABASE_URL ||
        "postgresql://postgres:postgres@localhost:5432/e_com_backend",
    },
  },
});
const repository = new PrismaShippingRepository(prisma as any);

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

describe("Shipping integration tests", () => {
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
    const order = await prisma.order.create({
      data: {
        tenantId: tenant.id,
        storeId: store.id,
        checkoutId: (
          await prisma.checkout.create({
            data: {
              tenantId: tenant.id,
              storeId: store.id,
              cartId: (
                await prisma.cart.create({
                  data: {
                    tenantId: tenant.id,
                    storeId: store.id,
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
    const orderItem = await prisma.orderItem.create({
      data: {
        orderId: order.id,
        variantId: variant.id,
        quantity: 2,
        unitAmountSnapshot: 1000,
        currencyCode: "USD",
      },
    });
    return { tenant, store, order, orderItem };
  }

  it("persists shipping zones and methods", async () => {
    const { tenant, store } = await createOrderScope();
    const zone = await repository.createShippingZone({
      tenantId: tenant.id,
      storeId: store.id,
      name: "France",
      countryCode: "FR",
    });
    const method = await repository.createShippingMethod({
      tenantId: tenant.id,
      storeId: store.id,
      shippingZoneId: zone.id,
      code: "standard",
      name: "Standard",
      amount: 500,
      currencyCode: "USD",
    });
    const storedZone = await prisma.shippingZone.findUnique({
      where: { id: zone.id },
    });
    const storedMethod = await prisma.shippingMethod.findUnique({
      where: { id: method.id },
    });
    expect(storedZone?.countryCode).toBe("FR");
    expect(storedMethod?.code).toBe("standard");
  });

  it("persists shipments and shipment items", async () => {
    const { tenant, store, order, orderItem } = await createOrderScope();
    const shipment = await repository.createShipment({
      tenantId: tenant.id,
      storeId: store.id,
      orderId: order.id,
    });
    const items = await repository.createShipmentItems(shipment.id, [
      { orderItemId: orderItem.id, quantity: 2 },
    ]);
    const storedShipment = await prisma.shipment.findUnique({
      where: { id: shipment.id },
    });
    const storedItems = await prisma.shipmentItem.findMany({
      where: { shipmentId: shipment.id },
    });
    expect(storedShipment?.orderId).toBe(order.id);
    expect(items).toHaveLength(1);
    expect(storedItems[0].orderItemId).toBe(orderItem.id);
  });

  it("persists tracking events", async () => {
    const { tenant, store, order } = await createOrderScope();
    const shipment = await repository.createShipment({
      tenantId: tenant.id,
      storeId: store.id,
      orderId: order.id,
    });
    const event = await repository.createTrackingEvent({
      shipmentId: shipment.id,
      status: "shipped",
      description: "Left warehouse",
      occurredAt: new Date(),
    });
    const stored = await prisma.trackingEvent.findUnique({
      where: { id: event.id },
    });
    expect(stored?.status).toBe("shipped");
  });
});

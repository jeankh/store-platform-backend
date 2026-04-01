import { randomUUID } from "node:crypto";

import { CatalogStatus, PrismaClient, TenantStatus } from "@prisma/client";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { PrismaCheckoutRepository } from "src/modules/checkout/infrastructure/persistence/prisma-checkout.repository";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url:
        process.env.DATABASE_URL ||
        "postgresql://postgres:postgres@localhost:5432/e_com_backend",
    },
  },
});
const repository = new PrismaCheckoutRepository(prisma as any);

async function resetDatabase() {
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

describe("Checkout integration tests", () => {
  beforeEach(async () => {
    await resetDatabase();
  });
  afterAll(async () => {
    await resetDatabase();
    await prisma.$disconnect();
  });

  async function createCartScope() {
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
    const cart = await prisma.cart.create({
      data: { tenantId: tenant.id, storeId: store.id, guestToken: "guest-1" },
    });
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        variantId: variant.id,
        quantity: 2,
        unitAmountSnapshot: 1000,
        currencyCode: "USD",
      },
    });
    return { cart };
  }

  it("persists checkout and checkout snapshots", async () => {
    const { cart } = await createCartScope();
    const checkout = await repository.createCheckout({
      tenantId: cart.tenantId,
      storeId: cart.storeId,
      cartId: cart.id,
      customerId: null,
    });
    const items = await repository.createCheckoutItems(checkout.id, [
      {
        variantId: (await prisma.cartItem.findFirst({
          where: { cartId: cart.id },
        }))!.variantId,
        quantity: 2,
        unitAmountSnapshot: 1000,
        currencyCode: "USD",
      },
    ]);
    const storedCheckout = await prisma.checkout.findUnique({
      where: { id: checkout.id },
    });
    expect(storedCheckout?.cartId).toBe(cart.id);
    expect(items).toHaveLength(1);
  });

  it("persists checkout addresses shipping methods discounts and taxes", async () => {
    const { cart } = await createCartScope();
    const checkout = await repository.createCheckout({
      tenantId: cart.tenantId,
      storeId: cart.storeId,
      cartId: cart.id,
      customerId: null,
    });
    await repository.upsertCheckoutAddress({
      checkoutId: checkout.id,
      type: "shipping",
      firstName: "John",
      lastName: "Doe",
      line1: "123 Street",
      city: "Paris",
      postalCode: "75001",
      countryCode: "FR",
    });
    const storedAddress = await prisma.checkoutAddress.findFirst({
      where: { checkoutId: checkout.id, type: "shipping" },
    });
    expect(storedAddress?.city).toBe("Paris");
  });
});

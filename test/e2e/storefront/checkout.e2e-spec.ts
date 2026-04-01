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

describe("Storefront checkout e2e tests", () => {
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
    await prisma.price.create({
      data: {
        tenantId: tenant.id,
        storeId: store.id,
        variantId: variant.id,
        currencyCode: "USD",
        amount: 1000,
      },
    });
    const warehouse = await prisma.warehouse.create({
      data: {
        tenantId: tenant.id,
        storeId: store.id,
        slug: "main-warehouse",
        name: "Main Warehouse",
      },
    });
    const location = await prisma.inventoryLocation.create({
      data: {
        tenantId: tenant.id,
        storeId: store.id,
        warehouseId: warehouse.id,
        slug: "main-location",
        name: "Main Location",
      },
    });
    const stockItem = await prisma.stockItem.create({
      data: {
        tenantId: tenant.id,
        storeId: store.id,
        variantId: variant.id,
        skuSnapshot: variant.sku,
      },
    });
    await prisma.inventoryLevel.create({
      data: {
        stockItemId: stockItem.id,
        locationId: location.id,
        availableQuantity: 10,
        reservedQuantity: 0,
      },
    });
    const cart = await request(app.getHttpServer())
      .post("/api/storefront/carts")
      .send({ tenantId: tenant.id, storeId: store.id });
    await request(app.getHttpServer())
      .post(`/api/storefront/carts/${cart.body.cart.id}/items`)
      .send({ variantId: variant.id, quantity: 2 });
    return { cartId: cart.body.cart.id };
  }

  it("POST /api/storefront/checkouts creates checkout from cart", async () => {
    const { cartId } = await createCartScope();
    const response = await request(app.getHttpServer())
      .post("/api/storefront/checkouts")
      .send({ cartId })
      .expect(201);
    expect(response.body.checkout.cartId).toBe(cartId);
  });

  it("GET /api/storefront/checkouts/:checkoutId returns checkout", async () => {
    const { cartId } = await createCartScope();
    const created = await request(app.getHttpServer())
      .post("/api/storefront/checkouts")
      .send({ cartId });
    const response = await request(app.getHttpServer())
      .get(`/api/storefront/checkouts/${created.body.checkout.id}`)
      .expect(200);
    expect(response.body.checkout.id).toBe(created.body.checkout.id);
  });

  it("PATCH /api/storefront/checkouts/:checkoutId updates checkout", async () => {
    const { cartId } = await createCartScope();
    const created = await request(app.getHttpServer())
      .post("/api/storefront/checkouts")
      .send({ cartId });
    const response = await request(app.getHttpServer())
      .patch(`/api/storefront/checkouts/${created.body.checkout.id}`)
      .send({
        shippingAddress: {
          firstName: "John",
          lastName: "Doe",
          line1: "123 Street",
          city: "Paris",
          postalCode: "75001",
          countryCode: "FR",
        },
        billingAddress: {
          firstName: "Jane",
          lastName: "Doe",
          line1: "456 Street",
          city: "Paris",
          postalCode: "75002",
          countryCode: "FR",
        },
      })
      .expect(200);
    expect(response.body.addresses).toHaveLength(2);
  });
});

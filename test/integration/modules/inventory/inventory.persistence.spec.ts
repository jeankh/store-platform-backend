import { randomUUID } from "node:crypto";

import { PrismaClient, TenantStatus } from "@prisma/client";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { PrismaInventoryRepository } from "src/modules/inventory/infrastructure/persistence/prisma-inventory.repository";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url:
        process.env.DATABASE_URL ||
        "postgresql://postgres:postgres@localhost:5432/e_com_backend",
    },
  },
});
const repository = new PrismaInventoryRepository(prisma as any);

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

describe("Inventory integration tests", () => {
  beforeEach(async () => {
    await resetDatabase();
  });
  afterAll(async () => {
    await resetDatabase();
    await prisma.$disconnect();
  });

  async function createVariantScope() {
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
      },
    });
    const variant = await prisma.productVariant.create({
      data: { productId: product.id, sku: "SKU-1", title: "Variant 1" },
    });
    return { tenant, store, variant };
  }

  it("persists warehouses and locations", async () => {
    const { tenant, store } = await createVariantScope();
    const warehouse = await repository.createWarehouse({
      tenantId: tenant.id,
      storeId: store.id,
      slug: "main-warehouse",
      name: "Main Warehouse",
    });
    const location = await repository.createLocation({
      tenantId: tenant.id,
      storeId: store.id,
      warehouseId: warehouse.id,
      slug: "main-location",
      name: "Main Location",
    });
    const storedLocation = await prisma.inventoryLocation.findUnique({
      where: { id: location.id },
    });
    expect(storedLocation?.warehouseId).toBe(warehouse.id);
  });
  it("persists stock items and inventory levels", async () => {
    const { tenant, store, variant } = await createVariantScope();
    const warehouse = await repository.createWarehouse({
      tenantId: tenant.id,
      storeId: store.id,
      slug: "main-warehouse",
      name: "Main Warehouse",
    });
    const location = await repository.createLocation({
      tenantId: tenant.id,
      storeId: store.id,
      warehouseId: warehouse.id,
      slug: "main-location",
      name: "Main Location",
    });
    const stockItem = await repository.createStockItem({
      tenantId: tenant.id,
      storeId: store.id,
      variantId: variant.id,
      skuSnapshot: variant.sku,
    });
    const level = await repository.createInventoryLevel({
      stockItemId: stockItem.id,
      locationId: location.id,
      availableQuantity: 10,
    });
    const storedLevel = await prisma.inventoryLevel.findUnique({
      where: {
        stockItemId_locationId: {
          stockItemId: stockItem.id,
          locationId: location.id,
        },
      },
    });
    expect(storedLevel?.availableQuantity).toBe(10);
  });
  it("persists stock adjustments and stock movements", async () => {
    const { tenant, store, variant } = await createVariantScope();
    const warehouse = await repository.createWarehouse({
      tenantId: tenant.id,
      storeId: store.id,
      slug: "main-warehouse",
      name: "Main Warehouse",
    });
    const location = await repository.createLocation({
      tenantId: tenant.id,
      storeId: store.id,
      warehouseId: warehouse.id,
      slug: "main-location",
      name: "Main Location",
    });
    const stockItem = await repository.createStockItem({
      tenantId: tenant.id,
      storeId: store.id,
      variantId: variant.id,
      skuSnapshot: variant.sku,
    });
    await repository.createInventoryLevel({
      stockItemId: stockItem.id,
      locationId: location.id,
      availableQuantity: 10,
    });
    const adjustment = await repository.createStockAdjustment({
      stockItemId: stockItem.id,
      locationId: location.id,
      delta: -2,
      reason: "manual",
      actorUserId: null,
    });
    const movement = await repository.createStockMovement({
      stockItemId: stockItem.id,
      locationId: location.id,
      movementType: "ADJUSTMENT",
      delta: -2,
      referenceType: "stock_adjustment",
      referenceId: adjustment.id,
    });
    const storedAdjustment = await prisma.stockAdjustment.findUnique({
      where: { id: adjustment.id },
    });
    const storedMovement = await prisma.stockMovement.findUnique({
      where: { id: movement.id },
    });
    expect(storedAdjustment?.delta).toBe(-2);
    expect(storedMovement?.movementType).toBe("ADJUSTMENT");
  });
  it("persists reservations and low-stock alerts", async () => {
    const { tenant, store, variant } = await createVariantScope();
    const warehouse = await repository.createWarehouse({
      tenantId: tenant.id,
      storeId: store.id,
      slug: "main-warehouse",
      name: "Main Warehouse",
    });
    const location = await repository.createLocation({
      tenantId: tenant.id,
      storeId: store.id,
      warehouseId: warehouse.id,
      slug: "main-location",
      name: "Main Location",
    });
    const stockItem = await repository.createStockItem({
      tenantId: tenant.id,
      storeId: store.id,
      variantId: variant.id,
      skuSnapshot: variant.sku,
    });
    await repository.createInventoryLevel({
      stockItemId: stockItem.id,
      locationId: location.id,
      availableQuantity: 10,
    });
    const reservation = await repository.createInventoryReservation({
      stockItemId: stockItem.id,
      locationId: location.id,
      referenceType: "cart",
      referenceId: "cart-1",
      quantity: 2,
    });
    const alert = await repository.createLowStockAlert({
      stockItemId: stockItem.id,
      locationId: location.id,
      threshold: 5,
    });
    const storedReservation = await prisma.inventoryReservation.findUnique({
      where: { id: reservation.id },
    });
    const storedAlert = await prisma.lowStockAlert.findUnique({
      where: { id: alert.id },
    });
    expect(storedReservation?.quantity).toBe(2);
    expect(storedAlert?.threshold).toBe(5);
  });
});

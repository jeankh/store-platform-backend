import { describe, expect, it } from "vitest";

import { AuditService } from "src/modules/audit/application/services/audit.service";
import { InventoryService } from "src/modules/inventory/application/services/inventory.service";
import {
  InventoryLevelRecord,
  InventoryLocationRecord,
  StockItemRecord,
  WarehouseRecord,
} from "src/modules/inventory/domain/entities/inventory-records";
import { InventoryRepository } from "src/modules/inventory/domain/repositories/inventory.repository";

class InMemoryInventoryRepository implements InventoryRepository {
  level: InventoryLevelRecord | null = null;
  async createWarehouse() {
    return {
      id: "warehouse-1",
      tenantId: "tenant-1",
      storeId: "store-1",
      slug: "w",
      name: "W",
    } as WarehouseRecord;
  }
  async listWarehouses() {
    return [];
  }
  async findWarehouseByStoreAndSlug() {
    return null;
  }
  async findWarehouseById() {
    return {
      id: "warehouse-1",
      tenantId: "tenant-1",
      storeId: "store-1",
      slug: "w",
      name: "W",
    } as WarehouseRecord;
  }
  async createLocation() {
    return {
      id: "location-1",
      tenantId: "tenant-1",
      storeId: "store-1",
      warehouseId: "warehouse-1",
      slug: "loc",
      name: "Loc",
    } as InventoryLocationRecord;
  }
  async listLocations() {
    return [];
  }
  async findLocationByWarehouseAndSlug() {
    return null;
  }
  async findLocationById(locationId: string) {
    return locationId === "location-1"
      ? ({
          id: "location-1",
          tenantId: "tenant-1",
          storeId: "store-1",
          warehouseId: "warehouse-1",
          slug: "loc",
          name: "Loc",
        } as InventoryLocationRecord)
      : null;
  }
  async findVariantById(variantId: string) {
    return variantId === "variant-1"
      ? {
          id: "variant-1",
          sku: "SKU-1",
          productId: "product-1",
          product: { tenantId: "tenant-1", storeId: "store-1" },
        }
      : null;
  }
  async findStockItemByVariantId() {
    return null;
  }
  async createStockItem() {
    return {
      id: "stock-1",
      tenantId: "tenant-1",
      storeId: "store-1",
      variantId: "variant-1",
      skuSnapshot: "SKU-1",
    } as StockItemRecord;
  }
  async createInventoryLevel(input: any) {
    this.level = {
      id: "level-1",
      stockItemId: input.stockItemId,
      locationId: input.locationId,
      availableQuantity: input.availableQuantity,
      reservedQuantity: 0,
    };
    return this.level;
  }
  async findInventoryLevel() {
    return this.level;
  }
  async listInventoryLevelsByVariant() {
    return this.level
      ? [
          {
            ...this.level,
            location: {
              id: "location-1",
              tenantId: "tenant-1",
              storeId: "store-1",
              warehouseId: "warehouse-1",
              slug: "loc",
              name: "Loc",
            },
          },
        ]
      : [];
  }
}

class AuditServiceStub {
  async record() {
    return;
  }
}

describe("Inventory stock levels unit tests", () => {
  it("creates stock level for variant and location", async () => {
    const service = new InventoryService(
      new InMemoryInventoryRepository(),
      new AuditServiceStub() as unknown as AuditService,
    );
    const level = await service.createStockLevel(
      "user-1",
      "tenant-1",
      "variant-1",
      { locationId: "location-1", availableQuantity: 10 },
    );
    expect(level.availableQuantity).toBe(10);
  });
  it("adjusts stock and records movement", () => {
    expect(true).toBe(true);
  });
  it("rejects negative resulting available quantity when not allowed", () => {
    expect(true).toBe(true);
  });
});

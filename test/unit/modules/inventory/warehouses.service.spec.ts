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
  warehouses = new Map<string, WarehouseRecord>();
  async createWarehouse(input: any) {
    const warehouse = {
      id: `warehouse-${this.warehouses.size + 1}`,
      ...input,
    } as WarehouseRecord;
    this.warehouses.set(warehouse.id, warehouse);
    return warehouse;
  }
  async listWarehouses(tenantId: string) {
    return Array.from(this.warehouses.values()).filter(
      (warehouse) => warehouse.tenantId === tenantId,
    );
  }
  async findWarehouseByStoreAndSlug(storeId: string, slug: string) {
    return (
      Array.from(this.warehouses.values()).find(
        (warehouse) => warehouse.storeId === storeId && warehouse.slug === slug,
      ) || null
    );
  }
  async findWarehouseById(warehouseId: string) {
    return this.warehouses.get(warehouseId) || null;
  }
  async createLocation(input: any) {
    return { id: "location-1", ...input } as InventoryLocationRecord;
  }
  async listLocations() {
    return [];
  }
  async findLocationByWarehouseAndSlug() {
    return null;
  }
  async findLocationById() {
    return null;
  }
  async findVariantById() {
    return null;
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
      skuSnapshot: "SKU",
    } as StockItemRecord;
  }
  async createInventoryLevel() {
    return {
      id: "level-1",
      stockItemId: "stock-1",
      locationId: "location-1",
      availableQuantity: 10,
      reservedQuantity: 0,
    } as InventoryLevelRecord;
  }
  async findInventoryLevel() {
    return null;
  }
  async listInventoryLevelsByVariant() {
    return [];
  }
}

class AuditServiceStub {
  async record() {
    return;
  }
}

describe("Inventory warehouses unit tests", () => {
  it("creates warehouse with valid store scope", async () => {
    const service = new InventoryService(
      new InMemoryInventoryRepository(),
      new AuditServiceStub() as unknown as AuditService,
    );
    const warehouse = await service.createWarehouse("user-1", "tenant-1", {
      tenantId: "tenant-1",
      storeId: "store-1",
      slug: "main-warehouse",
      name: "Main Warehouse",
    });
    expect(warehouse.slug).toBe("main-warehouse");
  });
  it("rejects duplicate warehouse slug within a store", async () => {
    const service = new InventoryService(
      new InMemoryInventoryRepository(),
      new AuditServiceStub() as unknown as AuditService,
    );
    await service.createWarehouse("user-1", "tenant-1", {
      tenantId: "tenant-1",
      storeId: "store-1",
      slug: "main-warehouse",
      name: "Main Warehouse",
    });
    await expect(
      service.createWarehouse("user-1", "tenant-1", {
        tenantId: "tenant-1",
        storeId: "store-1",
        slug: "main-warehouse",
        name: "Other Warehouse",
      }),
    ).rejects.toThrow("Warehouse slug already exists for store");
  });
});

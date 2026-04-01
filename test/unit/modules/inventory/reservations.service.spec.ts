import { describe, expect, it } from "vitest";

import { AuditService } from "src/modules/audit/application/services/audit.service";
import { InventoryService } from "src/modules/inventory/application/services/inventory.service";
import {
  InventoryLevelRecord,
  InventoryLocationRecord,
  InventoryReservationRecord,
  LowStockAlertRecord,
  StockAdjustmentRecord,
  StockItemRecord,
  StockMovementRecord,
  WarehouseRecord,
} from "src/modules/inventory/domain/entities/inventory-records";
import { InventoryRepository } from "src/modules/inventory/domain/repositories/inventory.repository";

class InMemoryInventoryRepository implements InventoryRepository {
  level: InventoryLevelRecord = {
    id: "level-1",
    stockItemId: "stock-1",
    locationId: "location-1",
    availableQuantity: 10,
    reservedQuantity: 0,
  };
  reservation: InventoryReservationRecord | null = null;

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
    return null;
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
  async findLocationById() {
    return {
      id: "location-1",
      tenantId: "tenant-1",
      storeId: "store-1",
      warehouseId: "warehouse-1",
      slug: "loc",
      name: "Loc",
    } as InventoryLocationRecord;
  }
  async findVariantById() {
    return {
      id: "variant-1",
      sku: "SKU-1",
      product: { tenantId: "tenant-1", storeId: "store-1" },
    };
  }
  async findStockItemByVariantId() {
    return {
      id: "stock-1",
      tenantId: "tenant-1",
      storeId: "store-1",
      variantId: "variant-1",
      skuSnapshot: "SKU-1",
    } as StockItemRecord;
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
  async createInventoryLevel() {
    return this.level;
  }
  async findInventoryLevel() {
    return this.level;
  }
  async listInventoryLevelsByVariant() {
    return [];
  }
  async createInventoryReservation(input: any) {
    const reservation: InventoryReservationRecord = {
      id: "reservation-1",
      stockItemId: input.stockItemId,
      locationId: input.locationId,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      quantity: input.quantity,
      status: "ACTIVE",
    };
    this.reservation = reservation;
    return reservation;
  }
  async findActiveReservation(referenceType: string, referenceId: string) {
    return this.reservation &&
      this.reservation.referenceType === referenceType &&
      this.reservation.referenceId === referenceId &&
      this.reservation.status === "ACTIVE"
      ? this.reservation
      : null;
  }
  async releaseReservation() {
    this.reservation = { ...this.reservation!, status: "RELEASED" };
    return this.reservation!;
  }
  async createStockAdjustment() {
    return {
      id: "adjustment-1",
      stockItemId: "stock-1",
      locationId: "location-1",
      delta: 1,
      reason: "manual",
      actorUserId: "user-1",
    } as StockAdjustmentRecord;
  }
  async createStockMovement(input: any) {
    return {
      id: "movement-1",
      stockItemId: input.stockItemId,
      locationId: input.locationId,
      movementType: input.movementType,
      delta: input.delta,
      referenceType: input.referenceType || null,
      referenceId: input.referenceId || null,
    } as StockMovementRecord;
  }
  async listStockMovementsByVariant() {
    return [];
  }
  async updateInventoryLevel(input: any) {
    this.level = {
      ...this.level,
      availableQuantity:
        input.availableQuantity ?? this.level.availableQuantity,
      reservedQuantity: input.reservedQuantity ?? this.level.reservedQuantity,
    };
    return this.level;
  }
  async createLowStockAlert() {
    return {
      id: "alert-1",
      stockItemId: "stock-1",
      locationId: "location-1",
      threshold: 5,
      isActive: true,
    } as LowStockAlertRecord;
  }
  async listLowStockAlerts() {
    return [];
  }
}

class AuditServiceStub {
  async record() {
    return;
  }
}

describe("Inventory reservations unit tests", () => {
  it("reserves stock when available quantity is sufficient", async () => {
    const service = new InventoryService(
      new InMemoryInventoryRepository(),
      new AuditServiceStub() as unknown as AuditService,
    );
    const reservation = await service.reserveStock(
      "user-1",
      "tenant-1",
      "variant-1",
      {
        locationId: "location-1",
        referenceType: "cart",
        referenceId: "cart-1",
        quantity: 2,
      },
    );
    expect(reservation.quantity).toBe(2);
    expect(reservation.status).toBe("ACTIVE");
  });

  it("rejects reservation when available quantity is insufficient", async () => {
    const repository = new InMemoryInventoryRepository();
    repository.level.availableQuantity = 1;
    const service = new InventoryService(
      repository,
      new AuditServiceStub() as unknown as AuditService,
    );
    await expect(
      service.reserveStock("user-1", "tenant-1", "variant-1", {
        locationId: "location-1",
        referenceType: "cart",
        referenceId: "cart-1",
        quantity: 2,
      }),
    ).rejects.toThrow("Insufficient available quantity for reservation");
  });

  it("releases reservation correctly", async () => {
    const repository = new InMemoryInventoryRepository();
    const service = new InventoryService(
      repository,
      new AuditServiceStub() as unknown as AuditService,
    );
    await service.reserveStock("user-1", "tenant-1", "variant-1", {
      locationId: "location-1",
      referenceType: "cart",
      referenceId: "cart-1",
      quantity: 2,
    });
    const released = await service.releaseReservation(
      "tenant-1",
      "cart",
      "cart-1",
    );
    expect(released.status).toBe("RELEASED");
  });
});

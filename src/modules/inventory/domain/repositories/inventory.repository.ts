import {
  InventoryLevelRecord,
  InventoryLocationRecord,
  InventoryReservationRecord,
  LowStockAlertRecord,
  StockItemRecord,
  StockAdjustmentRecord,
  StockMovementRecord,
  WarehouseRecord,
} from "../entities/inventory-records";

export type CreateWarehouseInput = {
  tenantId: string;
  storeId: string;
  slug: string;
  name: string;
};

export type CreateInventoryLocationInput = {
  tenantId: string;
  storeId: string;
  warehouseId: string;
  slug: string;
  name: string;
};

export type CreateInventoryLevelInput = {
  tenantId: string;
  storeId: string;
  variantId: string;
  locationId: string;
  availableQuantity: number;
};

export interface InventoryRepository {
  createWarehouse(input: CreateWarehouseInput): Promise<WarehouseRecord>;
  listWarehouses(tenantId: string): Promise<WarehouseRecord[]>;
  findWarehouseByStoreAndSlug(
    storeId: string,
    slug: string,
  ): Promise<WarehouseRecord | null>;
  findWarehouseById(warehouseId: string): Promise<WarehouseRecord | null>;

  createLocation(
    input: CreateInventoryLocationInput,
  ): Promise<InventoryLocationRecord>;
  listLocations(tenantId: string): Promise<InventoryLocationRecord[]>;
  findLocationByWarehouseAndSlug(
    warehouseId: string,
    slug: string,
  ): Promise<InventoryLocationRecord | null>;
  findLocationById(locationId: string): Promise<InventoryLocationRecord | null>;

  findVariantById(variantId: string): Promise<{
    id: string;
    sku: string;
    product: { tenantId: string; storeId: string };
  } | null>;
  findStockItemByVariantId(variantId: string): Promise<StockItemRecord | null>;
  createStockItem(input: {
    tenantId: string;
    storeId: string;
    variantId: string;
    skuSnapshot: string;
  }): Promise<StockItemRecord>;
  createInventoryLevel(input: {
    stockItemId: string;
    locationId: string;
    availableQuantity: number;
    reservedQuantity?: number;
  }): Promise<InventoryLevelRecord>;
  findInventoryLevel(
    stockItemId: string,
    locationId: string,
  ): Promise<InventoryLevelRecord | null>;
  listInventoryLevelsByVariant(
    variantId: string,
  ): Promise<
    Array<InventoryLevelRecord & { location: InventoryLocationRecord }>
  >;

  createInventoryReservation(input: {
    stockItemId: string;
    locationId: string;
    referenceType: string;
    referenceId: string;
    quantity: number;
  }): Promise<InventoryReservationRecord>;
  findActiveReservation(
    referenceType: string,
    referenceId: string,
  ): Promise<InventoryReservationRecord | null>;
  releaseReservation(
    reservationId: string,
  ): Promise<InventoryReservationRecord>;
  createStockAdjustment(input: {
    stockItemId: string;
    locationId: string;
    delta: number;
    reason: string;
    actorUserId?: string | null;
  }): Promise<StockAdjustmentRecord>;
  createStockMovement(input: {
    stockItemId: string;
    locationId: string;
    movementType: "ADJUSTMENT" | "RESERVATION" | "RELEASE";
    delta: number;
    referenceType?: string | null;
    referenceId?: string | null;
  }): Promise<StockMovementRecord>;
  listStockMovementsByVariant(
    variantId: string,
  ): Promise<StockMovementRecord[]>;
  updateInventoryLevel(input: {
    stockItemId: string;
    locationId: string;
    availableQuantity?: number;
    reservedQuantity?: number;
  }): Promise<InventoryLevelRecord>;
  createLowStockAlert(input: {
    stockItemId: string;
    locationId: string;
    threshold: number;
    isActive?: boolean;
  }): Promise<LowStockAlertRecord>;
  listLowStockAlerts(tenantId: string): Promise<LowStockAlertRecord[]>;
}

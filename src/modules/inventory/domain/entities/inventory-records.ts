export type WarehouseRecord = {
  id: string;
  tenantId: string;
  storeId: string;
  slug: string;
  name: string;
};

export type InventoryLocationRecord = {
  id: string;
  tenantId: string;
  storeId: string;
  warehouseId: string;
  slug: string;
  name: string;
};

export type StockItemRecord = {
  id: string;
  tenantId: string;
  storeId: string;
  variantId: string;
  skuSnapshot: string;
};

export type InventoryLevelRecord = {
  id: string;
  stockItemId: string;
  locationId: string;
  availableQuantity: number;
  reservedQuantity: number;
};

export type InventoryReservationRecord = {
  id: string;
  stockItemId: string;
  locationId: string;
  referenceType: string;
  referenceId: string;
  quantity: number;
  status: "ACTIVE" | "RELEASED";
};

export type StockAdjustmentRecord = {
  id: string;
  stockItemId: string;
  locationId: string;
  delta: number;
  reason: string;
  actorUserId: string | null;
};

export type StockMovementRecord = {
  id: string;
  stockItemId: string;
  locationId: string;
  movementType: "ADJUSTMENT" | "RESERVATION" | "RELEASE";
  delta: number;
  referenceType: string | null;
  referenceId: string | null;
};

export type LowStockAlertRecord = {
  id: string;
  stockItemId: string;
  locationId: string;
  threshold: number;
  isActive: boolean;
};

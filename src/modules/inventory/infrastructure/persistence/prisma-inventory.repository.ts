import { Injectable } from "@nestjs/common";

import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";

import {
  InventoryLevelRecord,
  InventoryLocationRecord,
  InventoryReservationRecord,
  LowStockAlertRecord,
  StockItemRecord,
  StockAdjustmentRecord,
  StockMovementRecord,
  WarehouseRecord,
} from "../../domain/entities/inventory-records";
import {
  CreateInventoryLevelInput,
  CreateInventoryLocationInput,
  CreateWarehouseInput,
  InventoryRepository,
} from "../../domain/repositories/inventory.repository";

@Injectable()
export class PrismaInventoryRepository implements InventoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createWarehouse(input: CreateWarehouseInput): Promise<WarehouseRecord> {
    const warehouse = await this.prisma.warehouse.create({ data: input });
    return this.mapWarehouse(warehouse);
  }

  async listWarehouses(tenantId: string): Promise<WarehouseRecord[]> {
    const warehouses = await this.prisma.warehouse.findMany({
      where: { tenantId },
      orderBy: { createdAt: "asc" },
    });
    return warehouses.map((warehouse) => this.mapWarehouse(warehouse));
  }

  async findWarehouseByStoreAndSlug(
    storeId: string,
    slug: string,
  ): Promise<WarehouseRecord | null> {
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { storeId_slug: { storeId, slug } },
    });
    return warehouse ? this.mapWarehouse(warehouse) : null;
  }

  async findWarehouseById(
    warehouseId: string,
  ): Promise<WarehouseRecord | null> {
    const warehouse = await this.prisma.warehouse
      .findUnique({ where: { id: warehouseId } })
      .catch(() => null);
    return warehouse ? this.mapWarehouse(warehouse) : null;
  }

  async createLocation(
    input: CreateInventoryLocationInput,
  ): Promise<InventoryLocationRecord> {
    const location = await this.prisma.inventoryLocation.create({
      data: input,
    });
    return this.mapLocation(location);
  }

  async listLocations(tenantId: string): Promise<InventoryLocationRecord[]> {
    const locations = await this.prisma.inventoryLocation.findMany({
      where: { tenantId },
      orderBy: { createdAt: "asc" },
    });
    return locations.map((location) => this.mapLocation(location));
  }

  async findLocationByWarehouseAndSlug(
    warehouseId: string,
    slug: string,
  ): Promise<InventoryLocationRecord | null> {
    const location = await this.prisma.inventoryLocation.findUnique({
      where: { warehouseId_slug: { warehouseId, slug } },
    });
    return location ? this.mapLocation(location) : null;
  }

  async findLocationById(
    locationId: string,
  ): Promise<InventoryLocationRecord | null> {
    const location = await this.prisma.inventoryLocation
      .findUnique({ where: { id: locationId } })
      .catch(() => null);
    return location ? this.mapLocation(location) : null;
  }

  async findVariantById(variantId: string) {
    return this.prisma.productVariant
      .findUnique({
        where: { id: variantId },
        include: { product: { select: { tenantId: true, storeId: true } } },
      })
      .catch(() => null);
  }

  async findStockItemByVariantId(
    variantId: string,
  ): Promise<StockItemRecord | null> {
    const stockItem = await this.prisma.stockItem.findUnique({
      where: { variantId },
    });
    return stockItem ? this.mapStockItem(stockItem) : null;
  }

  async createStockItem(input: {
    tenantId: string;
    storeId: string;
    variantId: string;
    skuSnapshot: string;
  }): Promise<StockItemRecord> {
    const stockItem = await this.prisma.stockItem.create({ data: input });
    return this.mapStockItem(stockItem);
  }

  async createInventoryLevel(input: {
    stockItemId: string;
    locationId: string;
    availableQuantity: number;
    reservedQuantity?: number;
  }): Promise<InventoryLevelRecord> {
    const level = await this.prisma.inventoryLevel.create({
      data: {
        stockItemId: input.stockItemId,
        locationId: input.locationId,
        availableQuantity: input.availableQuantity,
        reservedQuantity: input.reservedQuantity || 0,
      },
    });
    return this.mapLevel(level);
  }

  async findInventoryLevel(
    stockItemId: string,
    locationId: string,
  ): Promise<InventoryLevelRecord | null> {
    const level = await this.prisma.inventoryLevel.findUnique({
      where: { stockItemId_locationId: { stockItemId, locationId } },
    });
    return level ? this.mapLevel(level) : null;
  }

  async listInventoryLevelsByVariant(
    variantId: string,
  ): Promise<
    Array<InventoryLevelRecord & { location: InventoryLocationRecord }>
  > {
    const levels = await this.prisma.inventoryLevel.findMany({
      where: { stockItem: { variantId } },
      include: { location: true },
      orderBy: { createdAt: "asc" },
    });
    return levels.map((level) => ({
      ...this.mapLevel(level),
      location: this.mapLocation(level.location),
    }));
  }

  async createInventoryReservation(input: {
    stockItemId: string;
    locationId: string;
    referenceType: string;
    referenceId: string;
    quantity: number;
  }): Promise<InventoryReservationRecord> {
    const reservation = await this.prisma.inventoryReservation.create({
      data: {
        stockItemId: input.stockItemId,
        locationId: input.locationId,
        referenceType: input.referenceType,
        referenceId: input.referenceId,
        quantity: input.quantity,
      },
    });
    return this.mapReservation(reservation);
  }

  async findActiveReservation(
    referenceType: string,
    referenceId: string,
  ): Promise<InventoryReservationRecord | null> {
    const reservation = await this.prisma.inventoryReservation.findFirst({
      where: { referenceType, referenceId, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    });
    return reservation ? this.mapReservation(reservation) : null;
  }

  async releaseReservation(
    reservationId: string,
  ): Promise<InventoryReservationRecord> {
    const reservation = await this.prisma.inventoryReservation.update({
      where: { id: reservationId },
      data: { status: "RELEASED" },
    });
    return this.mapReservation(reservation);
  }

  async createStockAdjustment(input: {
    stockItemId: string;
    locationId: string;
    delta: number;
    reason: string;
    actorUserId?: string | null;
  }): Promise<StockAdjustmentRecord> {
    const adjustment = await this.prisma.stockAdjustment.create({
      data: {
        stockItemId: input.stockItemId,
        locationId: input.locationId,
        delta: input.delta,
        reason: input.reason,
        actorUserId: input.actorUserId || null,
      },
    });
    return this.mapAdjustment(adjustment);
  }

  async createStockMovement(input: {
    stockItemId: string;
    locationId: string;
    movementType: "ADJUSTMENT" | "RESERVATION" | "RELEASE";
    delta: number;
    referenceType?: string | null;
    referenceId?: string | null;
  }): Promise<StockMovementRecord> {
    const movement = await this.prisma.stockMovement.create({
      data: {
        stockItemId: input.stockItemId,
        locationId: input.locationId,
        movementType: input.movementType,
        delta: input.delta,
        referenceType: input.referenceType || null,
        referenceId: input.referenceId || null,
      },
    });
    return this.mapMovement(movement);
  }

  async listStockMovementsByVariant(
    variantId: string,
  ): Promise<StockMovementRecord[]> {
    const movements = await this.prisma.stockMovement.findMany({
      where: { stockItem: { variantId } },
      orderBy: { createdAt: "asc" },
    });
    return movements.map((movement) => this.mapMovement(movement));
  }

  async updateInventoryLevel(input: {
    stockItemId: string;
    locationId: string;
    availableQuantity?: number;
    reservedQuantity?: number;
  }): Promise<InventoryLevelRecord> {
    const level = await this.prisma.inventoryLevel.update({
      where: {
        stockItemId_locationId: {
          stockItemId: input.stockItemId,
          locationId: input.locationId,
        },
      },
      data: {
        availableQuantity: input.availableQuantity,
        reservedQuantity: input.reservedQuantity,
      },
    });
    return this.mapLevel(level);
  }

  async createLowStockAlert(input: {
    stockItemId: string;
    locationId: string;
    threshold: number;
    isActive?: boolean;
  }): Promise<LowStockAlertRecord> {
    const alert = await this.prisma.lowStockAlert.create({
      data: {
        stockItemId: input.stockItemId,
        locationId: input.locationId,
        threshold: input.threshold,
        isActive: input.isActive ?? true,
      },
    });
    return this.mapAlert(alert);
  }

  async listLowStockAlerts(tenantId: string): Promise<LowStockAlertRecord[]> {
    const alerts = await this.prisma.lowStockAlert.findMany({
      where: { stockItem: { tenantId } },
      orderBy: { createdAt: "asc" },
    });
    return alerts.map((alert) => this.mapAlert(alert));
  }

  private mapWarehouse(warehouse: {
    id: string;
    tenantId: string;
    storeId: string;
    slug: string;
    name: string;
  }): WarehouseRecord {
    return {
      id: warehouse.id,
      tenantId: warehouse.tenantId,
      storeId: warehouse.storeId,
      slug: warehouse.slug,
      name: warehouse.name,
    };
  }

  private mapLocation(location: {
    id: string;
    tenantId: string;
    storeId: string;
    warehouseId: string;
    slug: string;
    name: string;
  }): InventoryLocationRecord {
    return {
      id: location.id,
      tenantId: location.tenantId,
      storeId: location.storeId,
      warehouseId: location.warehouseId,
      slug: location.slug,
      name: location.name,
    };
  }

  private mapStockItem(stockItem: {
    id: string;
    tenantId: string;
    storeId: string;
    variantId: string;
    skuSnapshot: string;
  }): StockItemRecord {
    return {
      id: stockItem.id,
      tenantId: stockItem.tenantId,
      storeId: stockItem.storeId,
      variantId: stockItem.variantId,
      skuSnapshot: stockItem.skuSnapshot,
    };
  }

  private mapLevel(level: {
    id: string;
    stockItemId: string;
    locationId: string;
    availableQuantity: number;
    reservedQuantity: number;
  }): InventoryLevelRecord {
    return {
      id: level.id,
      stockItemId: level.stockItemId,
      locationId: level.locationId,
      availableQuantity: level.availableQuantity,
      reservedQuantity: level.reservedQuantity,
    };
  }

  private mapReservation(reservation: {
    id: string;
    stockItemId: string;
    locationId: string;
    referenceType: string;
    referenceId: string;
    quantity: number;
    status: "ACTIVE" | "RELEASED";
  }): InventoryReservationRecord {
    return {
      id: reservation.id,
      stockItemId: reservation.stockItemId,
      locationId: reservation.locationId,
      referenceType: reservation.referenceType,
      referenceId: reservation.referenceId,
      quantity: reservation.quantity,
      status: reservation.status,
    };
  }

  private mapAdjustment(adjustment: {
    id: string;
    stockItemId: string;
    locationId: string;
    delta: number;
    reason: string;
    actorUserId: string | null;
  }): StockAdjustmentRecord {
    return {
      id: adjustment.id,
      stockItemId: adjustment.stockItemId,
      locationId: adjustment.locationId,
      delta: adjustment.delta,
      reason: adjustment.reason,
      actorUserId: adjustment.actorUserId,
    };
  }

  private mapMovement(movement: {
    id: string;
    stockItemId: string;
    locationId: string;
    movementType: "ADJUSTMENT" | "RESERVATION" | "RELEASE";
    delta: number;
    referenceType: string | null;
    referenceId: string | null;
  }): StockMovementRecord {
    return {
      id: movement.id,
      stockItemId: movement.stockItemId,
      locationId: movement.locationId,
      movementType: movement.movementType,
      delta: movement.delta,
      referenceType: movement.referenceType,
      referenceId: movement.referenceId,
    };
  }

  private mapAlert(alert: {
    id: string;
    stockItemId: string;
    locationId: string;
    threshold: number;
    isActive: boolean;
  }): LowStockAlertRecord {
    return {
      id: alert.id,
      stockItemId: alert.stockItemId,
      locationId: alert.locationId,
      threshold: alert.threshold,
      isActive: alert.isActive,
    };
  }
}

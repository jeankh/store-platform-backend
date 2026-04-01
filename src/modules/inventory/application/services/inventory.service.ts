import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { AuditService } from "src/modules/audit/application/services/audit.service";

import {
  InventoryLevelRecord,
  InventoryLocationRecord,
  InventoryReservationRecord,
  LowStockAlertRecord,
  StockAdjustmentRecord,
  StockMovementRecord,
  WarehouseRecord,
} from "../../domain/entities/inventory-records";
import { INVENTORY_REPOSITORY } from "../../domain/repositories/inventory.repository.token";
import { InventoryRepository } from "../../domain/repositories/inventory.repository";

@Injectable()
export class InventoryService {
  constructor(
    @Inject(INVENTORY_REPOSITORY)
    private readonly repository: InventoryRepository,
    @Inject(AuditService) private readonly auditService: AuditService,
  ) {}

  async createWarehouse(
    actorUserId: string,
    actorTenantId: string,
    input: { tenantId: string; storeId: string; slug: string; name: string },
  ): Promise<WarehouseRecord> {
    this.ensureTenantAccess(actorTenantId, input.tenantId);
    const normalizedSlug = this.normalizeSlug(input.slug);
    const existing = await this.repository.findWarehouseByStoreAndSlug(
      input.storeId,
      normalizedSlug,
    );
    if (existing)
      throw new ConflictException("Warehouse slug already exists for store");
    const warehouse = await this.repository.createWarehouse({
      ...input,
      slug: normalizedSlug,
    });
    await this.auditService.record({
      tenantId: input.tenantId,
      actorUserId,
      action: "inventory.warehouse.created",
      entityType: "warehouse",
      entityId: warehouse.id,
      metadata: { slug: warehouse.slug },
    });
    return warehouse;
  }

  listWarehouses(actorTenantId: string) {
    return this.repository.listWarehouses(actorTenantId);
  }

  async createLocation(
    actorUserId: string,
    actorTenantId: string,
    input: {
      tenantId: string;
      storeId: string;
      warehouseId: string;
      slug: string;
      name: string;
    },
  ): Promise<InventoryLocationRecord> {
    this.ensureTenantAccess(actorTenantId, input.tenantId);
    const warehouse = await this.repository.findWarehouseById(
      input.warehouseId,
    );
    if (!warehouse) throw new NotFoundException("Warehouse not found");
    const normalizedSlug = this.normalizeSlug(input.slug);
    const existing = await this.repository.findLocationByWarehouseAndSlug(
      input.warehouseId,
      normalizedSlug,
    );
    if (existing)
      throw new ConflictException("Location slug already exists for warehouse");
    const location = await this.repository.createLocation({
      ...input,
      slug: normalizedSlug,
    });
    await this.auditService.record({
      tenantId: input.tenantId,
      actorUserId,
      action: "inventory.location.created",
      entityType: "inventory_location",
      entityId: location.id,
      metadata: { slug: location.slug },
    });
    return location;
  }

  listLocations(actorTenantId: string) {
    return this.repository.listLocations(actorTenantId);
  }

  async createStockLevel(
    actorUserId: string,
    actorTenantId: string,
    variantId: string,
    input: { locationId: string; availableQuantity: number },
  ): Promise<InventoryLevelRecord> {
    const variant = await this.repository.findVariantById(variantId);
    if (!variant) throw new NotFoundException("Variant not found");
    this.ensureTenantAccess(actorTenantId, variant.product.tenantId);
    const location = await this.repository.findLocationById(input.locationId);
    if (!location) throw new NotFoundException("Inventory location not found");
    let stockItem = await this.repository.findStockItemByVariantId(variantId);
    if (!stockItem) {
      stockItem = await this.repository.createStockItem({
        tenantId: variant.product.tenantId,
        storeId: variant.product.storeId,
        variantId,
        skuSnapshot: variant.sku,
      });
    }
    const existingLevel = await this.repository.findInventoryLevel(
      stockItem.id,
      location.id,
    );
    if (existingLevel)
      throw new ConflictException(
        "Inventory level already exists for variant and location",
      );
    const level = await this.repository.createInventoryLevel({
      stockItemId: stockItem.id,
      locationId: location.id,
      availableQuantity: input.availableQuantity,
    });
    await this.auditService.record({
      tenantId: variant.product.tenantId,
      actorUserId,
      action: "inventory.level.created",
      entityType: "inventory_level",
      entityId: level.id,
      metadata: { variantId, locationId: location.id },
    });
    return level;
  }

  async listStockLevels(actorTenantId: string, variantId: string) {
    const variant = await this.repository.findVariantById(variantId);
    if (!variant) throw new NotFoundException("Variant not found");
    this.ensureTenantAccess(actorTenantId, variant.product.tenantId);
    return this.repository.listInventoryLevelsByVariant(variantId);
  }

  async adjustStock(
    actorUserId: string,
    actorTenantId: string,
    variantId: string,
    input: { locationId: string; delta: number; reason: string },
  ): Promise<StockAdjustmentRecord> {
    const variant = await this.repository.findVariantById(variantId);
    if (!variant) throw new NotFoundException("Variant not found");
    this.ensureTenantAccess(actorTenantId, variant.product.tenantId);
    const stockItem = await this.repository.findStockItemByVariantId(variantId);
    if (!stockItem) throw new NotFoundException("Stock item not found");
    const level = await this.repository.findInventoryLevel(
      stockItem.id,
      input.locationId,
    );
    if (!level) throw new NotFoundException("Inventory level not found");
    if (level.availableQuantity + input.delta < 0)
      throw new ConflictException(
        "Resulting available quantity cannot be negative",
      );
    const adjustment = await this.repository.createStockAdjustment({
      stockItemId: stockItem.id,
      locationId: input.locationId,
      delta: input.delta,
      reason: input.reason,
      actorUserId,
    });
    await this.repository.updateInventoryLevel({
      stockItemId: stockItem.id,
      locationId: input.locationId,
      availableQuantity: level.availableQuantity + input.delta,
      reservedQuantity: level.reservedQuantity,
    });
    await this.repository.createStockMovement({
      stockItemId: stockItem.id,
      locationId: input.locationId,
      movementType: "ADJUSTMENT",
      delta: input.delta,
      referenceType: "stock_adjustment",
      referenceId: adjustment.id,
    });
    return adjustment;
  }

  async reserveStock(
    actorUserId: string,
    actorTenantId: string,
    variantId: string,
    input: {
      locationId: string;
      referenceType: string;
      referenceId: string;
      quantity: number;
    },
  ): Promise<InventoryReservationRecord> {
    const variant = await this.repository.findVariantById(variantId);
    if (!variant) throw new NotFoundException("Variant not found");
    this.ensureTenantAccess(actorTenantId, variant.product.tenantId);
    const stockItem = await this.repository.findStockItemByVariantId(variantId);
    if (!stockItem) throw new NotFoundException("Stock item not found");
    const level = await this.repository.findInventoryLevel(
      stockItem.id,
      input.locationId,
    );
    if (!level) throw new NotFoundException("Inventory level not found");
    if (level.availableQuantity < input.quantity)
      throw new ConflictException(
        "Insufficient available quantity for reservation",
      );
    const reservation = await this.repository.createInventoryReservation({
      stockItemId: stockItem.id,
      locationId: input.locationId,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      quantity: input.quantity,
    });
    await this.repository.updateInventoryLevel({
      stockItemId: stockItem.id,
      locationId: input.locationId,
      availableQuantity: level.availableQuantity - input.quantity,
      reservedQuantity: level.reservedQuantity + input.quantity,
    });
    await this.repository.createStockMovement({
      stockItemId: stockItem.id,
      locationId: input.locationId,
      movementType: "RESERVATION",
      delta: -input.quantity,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
    });
    return reservation;
  }

  async releaseReservation(
    actorTenantId: string,
    referenceType: string,
    referenceId: string,
  ): Promise<InventoryReservationRecord> {
    const reservation = await this.repository.findActiveReservation(
      referenceType,
      referenceId,
    );
    if (!reservation) throw new NotFoundException("Reservation not found");
    const level = await this.repository.findInventoryLevel(
      reservation.stockItemId,
      reservation.locationId,
    );
    if (!level) throw new NotFoundException("Inventory level not found");
    const released = await this.repository.releaseReservation(reservation.id);
    await this.repository.updateInventoryLevel({
      stockItemId: reservation.stockItemId,
      locationId: reservation.locationId,
      availableQuantity: level.availableQuantity + reservation.quantity,
      reservedQuantity: level.reservedQuantity - reservation.quantity,
    });
    await this.repository.createStockMovement({
      stockItemId: reservation.stockItemId,
      locationId: reservation.locationId,
      movementType: "RELEASE",
      delta: reservation.quantity,
      referenceType,
      referenceId,
    });
    return released;
  }

  async listStockMovements(
    actorTenantId: string,
    variantId: string,
  ): Promise<StockMovementRecord[]> {
    const variant = await this.repository.findVariantById(variantId);
    if (!variant) throw new NotFoundException("Variant not found");
    this.ensureTenantAccess(actorTenantId, variant.product.tenantId);
    return this.repository.listStockMovementsByVariant(variantId);
  }

  async listLowStockAlerts(
    actorTenantId: string,
  ): Promise<LowStockAlertRecord[]> {
    return this.repository.listLowStockAlerts(actorTenantId);
  }

  private ensureTenantAccess(actorTenantId: string, targetTenantId: string) {
    if (actorTenantId !== targetTenantId)
      throw new ForbiddenException("Cross-tenant access is not allowed");
  }

  private normalizeSlug(slug: string) {
    return slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
}

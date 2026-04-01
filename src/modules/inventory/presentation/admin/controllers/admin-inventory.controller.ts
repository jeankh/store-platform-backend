import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from "@nestjs/common";

import { PermissionGuard } from "src/modules/access-control/presentation/admin/permission.guard";
import { RequirePermission } from "src/modules/access-control/presentation/admin/require-permission.decorator";
import { AccessTokenGuard } from "src/modules/identity/presentation/admin/access-token.guard";
import { AuthUser } from "src/modules/identity/presentation/admin/auth-user.decorator";
import { AuthenticatedUser } from "src/modules/identity/presentation/admin/authenticated-user.interface";

import { InventoryService } from "../../../application/services/inventory.service";
import { CreateLocationDto } from "../dto/create-location.dto";
import { CreateStockAdjustmentDto } from "../dto/create-stock-adjustment.dto";
import { CreateStockLevelDto } from "../dto/create-stock-level.dto";
import { CreateWarehouseDto } from "../dto/create-warehouse.dto";

@Controller("admin")
@UseGuards(AccessTokenGuard, PermissionGuard)
export class AdminInventoryController {
  constructor(
    @Inject(InventoryService)
    private readonly inventoryService: InventoryService,
  ) {}

  @Post("warehouses")
  @RequirePermission("warehouse.update")
  createWarehouse(
    @AuthUser() user: AuthenticatedUser,
    @Body() body: CreateWarehouseDto,
  ) {
    return this.inventoryService.createWarehouse(
      user.userId,
      user.tenantId,
      body,
    );
  }

  @Get("warehouses")
  @RequirePermission("warehouse.read")
  listWarehouses(@AuthUser() user: AuthenticatedUser) {
    return this.inventoryService.listWarehouses(user.tenantId);
  }

  @Post("locations")
  @RequirePermission("warehouse.update")
  createLocation(
    @AuthUser() user: AuthenticatedUser,
    @Body() body: CreateLocationDto,
  ) {
    return this.inventoryService.createLocation(
      user.userId,
      user.tenantId,
      body,
    );
  }

  @Get("locations")
  @RequirePermission("warehouse.read")
  listLocations(@AuthUser() user: AuthenticatedUser) {
    return this.inventoryService.listLocations(user.tenantId);
  }

  @Post("variants/:variantId/stock-levels")
  @RequirePermission("inventory.update")
  createStockLevel(
    @AuthUser() user: AuthenticatedUser,
    @Param("variantId", new ParseUUIDPipe()) variantId: string,
    @Body() body: CreateStockLevelDto,
  ) {
    return this.inventoryService.createStockLevel(
      user.userId,
      user.tenantId,
      variantId,
      body,
    );
  }

  @Get("variants/:variantId/stock-levels")
  @RequirePermission("inventory.read")
  listStockLevels(
    @AuthUser() user: AuthenticatedUser,
    @Param("variantId", new ParseUUIDPipe()) variantId: string,
  ) {
    return this.inventoryService.listStockLevels(user.tenantId, variantId);
  }

  @Post("variants/:variantId/stock-adjustments")
  @RequirePermission("inventory.update")
  createStockAdjustment(
    @AuthUser() user: AuthenticatedUser,
    @Param("variantId", new ParseUUIDPipe()) variantId: string,
    @Body() body: CreateStockAdjustmentDto,
  ) {
    return this.inventoryService.adjustStock(
      user.userId,
      user.tenantId,
      variantId,
      body,
    );
  }

  @Get("variants/:variantId/stock-movements")
  @RequirePermission("inventory.read")
  listStockMovements(
    @AuthUser() user: AuthenticatedUser,
    @Param("variantId", new ParseUUIDPipe()) variantId: string,
  ) {
    return this.inventoryService.listStockMovements(user.tenantId, variantId);
  }

  @Get("low-stock-alerts")
  @RequirePermission("inventory.read")
  listLowStockAlerts(@AuthUser() user: AuthenticatedUser) {
    return this.inventoryService.listLowStockAlerts(user.tenantId);
  }
}

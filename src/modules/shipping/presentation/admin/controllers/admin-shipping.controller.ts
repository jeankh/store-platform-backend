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

import { ShippingService } from "../../../application/services/shipping.service";
import { CreateShipmentDto } from "../dto/create-shipment.dto";
import { CreateShippingMethodDto } from "../dto/create-shipping-method.dto";
import { CreateShippingZoneDto } from "../dto/create-shipping-zone.dto";
import { CreateTrackingEventDto } from "../dto/create-tracking-event.dto";

@Controller("admin")
@UseGuards(AccessTokenGuard, PermissionGuard)
export class AdminShippingController {
  constructor(
    @Inject(ShippingService) private readonly shippingService: ShippingService,
  ) {}

  @Post("shipping-zones")
  @RequirePermission("shipping.update")
  createShippingZone(
    @AuthUser() user: AuthenticatedUser,
    @Body() body: CreateShippingZoneDto,
  ) {
    return this.shippingService.createShippingZone(
      user.userId,
      user.tenantId,
      body,
    );
  }

  @Get("shipping-zones")
  @RequirePermission("shipping.read")
  listShippingZones(@AuthUser() user: AuthenticatedUser) {
    return this.shippingService.listShippingZones(user.tenantId);
  }

  @Post("shipping-methods")
  @RequirePermission("shipping.update")
  createShippingMethod(
    @AuthUser() user: AuthenticatedUser,
    @Body() body: CreateShippingMethodDto,
  ) {
    return this.shippingService.createShippingMethod(
      user.userId,
      user.tenantId,
      body,
    );
  }

  @Get("shipping-methods")
  @RequirePermission("shipping.read")
  listShippingMethods(@AuthUser() user: AuthenticatedUser) {
    return this.shippingService.listShippingMethods(user.tenantId);
  }

  @Post("orders/:orderId/shipments")
  @RequirePermission("shipping.update")
  createShipment(
    @AuthUser() user: AuthenticatedUser,
    @Param("orderId", new ParseUUIDPipe()) orderId: string,
    @Body() body: CreateShipmentDto,
  ) {
    return this.shippingService.createShipment(
      user.userId,
      user.tenantId,
      orderId,
      body,
    );
  }

  @Get("orders/:orderId/shipments")
  @RequirePermission("shipping.read")
  listOrderShipments(
    @AuthUser() user: AuthenticatedUser,
    @Param("orderId", new ParseUUIDPipe()) orderId: string,
  ) {
    return this.shippingService.listOrderShipments(user.tenantId, orderId);
  }

  @Post("shipments/:shipmentId/tracking-events")
  @RequirePermission("shipping.update")
  addTrackingEvent(
    @AuthUser() user: AuthenticatedUser,
    @Param("shipmentId", new ParseUUIDPipe()) shipmentId: string,
    @Body() body: CreateTrackingEventDto,
  ) {
    return this.shippingService.addTrackingEvent(
      user.userId,
      user.tenantId,
      shipmentId,
      body,
    );
  }
}

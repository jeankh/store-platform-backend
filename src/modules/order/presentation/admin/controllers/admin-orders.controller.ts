import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";

import { PermissionGuard } from "src/modules/access-control/presentation/admin/permission.guard";
import { RequirePermission } from "src/modules/access-control/presentation/admin/require-permission.decorator";
import { AccessTokenGuard } from "src/modules/identity/presentation/admin/access-token.guard";
import { AuthUser } from "src/modules/identity/presentation/admin/auth-user.decorator";
import { AuthenticatedUser } from "src/modules/identity/presentation/admin/authenticated-user.interface";

import { OrderService } from "../../../application/services/order.service";
import { CreateOrderNoteDto } from "../dto/create-order-note.dto";
import { UpdateOrderStatusDto } from "../dto/update-order-status.dto";

@Controller("admin/orders")
@UseGuards(AccessTokenGuard, PermissionGuard)
export class AdminOrdersController {
  constructor(
    @Inject(OrderService) private readonly orderService: OrderService,
  ) {}

  @Get()
  @RequirePermission("order.read")
  listOrders(@AuthUser() user: AuthenticatedUser) {
    return this.orderService.listAdminOrders(user.tenantId);
  }

  @Get(":orderId")
  @RequirePermission("order.read")
  getOrder(@Param("orderId", new ParseUUIDPipe()) orderId: string) {
    return this.orderService.getOrder(orderId);
  }

  @Patch(":orderId/status")
  @RequirePermission("order.update")
  updateOrderStatus(
    @AuthUser() user: AuthenticatedUser,
    @Param("orderId", new ParseUUIDPipe()) orderId: string,
    @Body() body: UpdateOrderStatusDto,
  ) {
    return this.orderService.updateOrderStatus(
      orderId,
      body.status,
      user.userId,
    );
  }

  @Post(":orderId/notes")
  @RequirePermission("order.note.update")
  addOrderNote(
    @AuthUser() user: AuthenticatedUser,
    @Param("orderId", new ParseUUIDPipe()) orderId: string,
    @Body() body: CreateOrderNoteDto,
  ) {
    return this.orderService.addOrderNote(orderId, user.userId, body.content);
  }
}

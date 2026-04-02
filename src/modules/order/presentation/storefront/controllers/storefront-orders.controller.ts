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

import { AuthCustomer } from "src/modules/customer/presentation/storefront/auth-customer.decorator";
import { AuthenticatedCustomer } from "src/modules/customer/presentation/storefront/authenticated-customer.interface";
import { CustomerAccessTokenGuard } from "src/modules/customer/presentation/storefront/customer-access-token.guard";

import { OrderService } from "../../../application/services/order.service";
import { CreateOrderDto } from "../dto/create-order.dto";

@Controller("storefront/orders")
@UseGuards(CustomerAccessTokenGuard)
export class StorefrontOrdersController {
  constructor(
    @Inject(OrderService) private readonly orderService: OrderService,
  ) {}

  @Post()
  createOrder(
    @AuthCustomer() customer: AuthenticatedCustomer,
    @Body() body: CreateOrderDto,
  ) {
    return this.orderService.createOrderForCustomer(
      customer.customerId,
      body.checkoutId,
    );
  }

  @Get()
  listOrders(@AuthCustomer() customer: AuthenticatedCustomer) {
    return this.orderService.listCustomerOrders(customer.customerId);
  }

  @Get(":orderId")
  getOrder(@Param("orderId", new ParseUUIDPipe()) orderId: string) {
    return this.orderService.getOrder(orderId);
  }
}

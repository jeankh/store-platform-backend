import {
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from "@nestjs/common";

import { AuthCustomer } from "src/modules/customer/presentation/storefront/auth-customer.decorator";
import { AuthenticatedCustomer } from "src/modules/customer/presentation/storefront/authenticated-customer.interface";
import { CustomerAccessTokenGuard } from "src/modules/customer/presentation/storefront/customer-access-token.guard";

import { ShippingService } from "../../../application/services/shipping.service";

@Controller("storefront/orders")
@UseGuards(CustomerAccessTokenGuard)
export class StorefrontShippingController {
  constructor(
    @Inject(ShippingService) private readonly shippingService: ShippingService,
  ) {}

  @Get(":orderId/shipments")
  listShipments(
    @AuthCustomer() customer: AuthenticatedCustomer,
    @Param("orderId", new ParseUUIDPipe()) orderId: string,
  ) {
    return this.shippingService.listOrderShipments(customer.tenantId, orderId);
  }
}

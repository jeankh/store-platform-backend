import {
  Body,
  Controller,
  Get,
  Inject,
  Patch,
  UseGuards,
} from "@nestjs/common";

import { CustomerProfileService } from "../../../application/services/customer-profile.service";
import { AuthCustomer } from "../auth-customer.decorator";
import { AuthenticatedCustomer } from "../authenticated-customer.interface";
import { CustomerAccessTokenGuard } from "../customer-access-token.guard";
import { UpdateCustomerProfileDto } from "../dto/update-customer-profile.dto";

@Controller("storefront/customers")
@UseGuards(CustomerAccessTokenGuard)
export class StorefrontCustomersController {
  constructor(
    @Inject(CustomerProfileService)
    private readonly customerProfileService: CustomerProfileService,
  ) {}

  @Get("me")
  getProfile(@AuthCustomer() customer: AuthenticatedCustomer) {
    return this.customerProfileService.getProfile(customer.customerId);
  }

  @Patch("me")
  updateProfile(
    @AuthCustomer() customer: AuthenticatedCustomer,
    @Body() body: UpdateCustomerProfileDto,
  ) {
    return this.customerProfileService.updateProfile({
      customerId: customer.customerId,
      ...body,
    });
  }
}

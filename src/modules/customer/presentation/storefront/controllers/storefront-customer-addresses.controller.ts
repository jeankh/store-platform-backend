import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";

import { CustomerAddressService } from "../../../application/services/customer-address.service";
import { AuthCustomer } from "../auth-customer.decorator";
import { AuthenticatedCustomer } from "../authenticated-customer.interface";
import { CustomerAccessTokenGuard } from "../customer-access-token.guard";
import { CreateCustomerAddressDto } from "../dto/create-customer-address.dto";
import { UpdateCustomerAddressDto } from "../dto/update-customer-address.dto";

@Controller("storefront/customers/me/addresses")
@UseGuards(CustomerAccessTokenGuard)
export class StorefrontCustomerAddressesController {
  constructor(
    @Inject(CustomerAddressService)
    private readonly customerAddressService: CustomerAddressService,
  ) {}

  @Get()
  list(@AuthCustomer() customer: AuthenticatedCustomer) {
    return this.customerAddressService.list(customer.customerId);
  }

  @Post()
  create(
    @AuthCustomer() customer: AuthenticatedCustomer,
    @Body() body: CreateCustomerAddressDto,
  ) {
    return this.customerAddressService.create({
      customerId: customer.customerId,
      ...body,
    });
  }

  @Patch(":addressId")
  update(
    @AuthCustomer() customer: AuthenticatedCustomer,
    @Param("addressId", new ParseUUIDPipe()) addressId: string,
    @Body() body: UpdateCustomerAddressDto,
  ) {
    return this.customerAddressService.update({
      addressId,
      customerId: customer.customerId,
      ...body,
    });
  }

  @Delete(":addressId")
  async remove(
    @AuthCustomer() customer: AuthenticatedCustomer,
    @Param("addressId", new ParseUUIDPipe()) addressId: string,
  ) {
    await this.customerAddressService.remove(customer.customerId, addressId);
  }
}

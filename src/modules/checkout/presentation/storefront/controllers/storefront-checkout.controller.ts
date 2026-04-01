import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from "@nestjs/common";

import { CheckoutService } from "../../../application/services/checkout.service";
import { CreateCheckoutDto } from "../dto/create-checkout.dto";
import { UpdateCheckoutDto } from "../dto/update-checkout.dto";

@Controller("storefront/checkouts")
export class StorefrontCheckoutController {
  constructor(
    @Inject(CheckoutService) private readonly checkoutService: CheckoutService,
  ) {}

  @Post()
  createCheckout(@Body() body: CreateCheckoutDto) {
    return this.checkoutService.createCheckout(body);
  }

  @Get(":checkoutId")
  getCheckout(@Param("checkoutId", new ParseUUIDPipe()) checkoutId: string) {
    return this.checkoutService.getCheckout(checkoutId);
  }

  @Patch(":checkoutId")
  updateCheckout(
    @Param("checkoutId", new ParseUUIDPipe()) checkoutId: string,
    @Body() body: UpdateCheckoutDto,
  ) {
    return this.checkoutService.updateCheckout(checkoutId, body);
  }
}

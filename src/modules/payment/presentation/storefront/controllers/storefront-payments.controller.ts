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

import { PaymentService } from "../../../application/services/payment.service";
import { CreatePaymentIntentDto } from "../dto/create-payment-intent.dto";

@Controller("storefront/orders")
@UseGuards(CustomerAccessTokenGuard)
export class StorefrontPaymentsController {
  constructor(
    @Inject(PaymentService) private readonly paymentService: PaymentService,
  ) {}

  @Post(":orderId/payment-intents")
  createPaymentIntent(
    @AuthCustomer() customer: AuthenticatedCustomer,
    @Param("orderId", new ParseUUIDPipe()) orderId: string,
    @Body() body: CreatePaymentIntentDto,
  ) {
    return this.paymentService.createPaymentIntent(
      customer.customerId,
      orderId,
      body,
    );
  }

  @Get(":orderId/payments")
  getOrderPayments(@Param("orderId", new ParseUUIDPipe()) orderId: string) {
    return this.paymentService.getOrderPayments(orderId);
  }
}

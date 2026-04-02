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

import { PaymentService } from "../../../application/services/payment.service";
import { CapturePaymentDto } from "../dto/capture-payment.dto";
import { RefundPaymentDto } from "../dto/refund-payment.dto";

@Controller("admin/payments")
@UseGuards(AccessTokenGuard, PermissionGuard)
export class AdminPaymentsController {
  constructor(
    @Inject(PaymentService) private readonly paymentService: PaymentService,
  ) {}

  @Get()
  @RequirePermission("payment.read")
  listPayments(@AuthUser() user: AuthenticatedUser) {
    return this.paymentService.listPaymentIntentsByTenant(user.tenantId);
  }

  @Get(":paymentIntentId")
  @RequirePermission("payment.read")
  getPayment(
    @Param("paymentIntentId", new ParseUUIDPipe()) paymentIntentId: string,
  ) {
    return this.paymentService.getPaymentIntent(paymentIntentId);
  }

  @Post(":paymentIntentId/capture")
  @RequirePermission("payment.update")
  capture(
    @Param("paymentIntentId", new ParseUUIDPipe()) paymentIntentId: string,
    @Body() body: CapturePaymentDto,
  ) {
    return this.paymentService.capturePayment(paymentIntentId, body.amount);
  }

  @Post(":paymentIntentId/refunds")
  @RequirePermission("payment.update")
  refund(
    @Param("paymentIntentId", new ParseUUIDPipe()) paymentIntentId: string,
    @Body() body: RefundPaymentDto,
  ) {
    return this.paymentService.refundPayment(
      paymentIntentId,
      body.amount,
      body.reason || null,
    );
  }
}

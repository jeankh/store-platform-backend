import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { PaymentView } from "../../domain/entities/payment-records";
import { PAYMENT_REPOSITORY } from "../../domain/repositories/payment.repository.token";
import { PaymentRepository } from "../../domain/repositories/payment.repository";

@Injectable()
export class PaymentService {
  constructor(
    @Inject(PAYMENT_REPOSITORY) private readonly repository: PaymentRepository,
  ) {}

  async createPaymentIntent(
    customerId: string,
    orderId: string,
    input: { provider: string },
  ): Promise<PaymentView> {
    const order = await this.repository.findOrderById(orderId);
    if (!order) throw new NotFoundException("Order not found");
    if (order.customerId && order.customerId !== customerId)
      throw new BadRequestException("Order does not belong to customer");
    const paymentIntent = await this.repository.createPaymentIntent({
      tenantId: order.tenantId,
      storeId: order.storeId,
      orderId: order.id,
      provider: input.provider,
      currencyCode: order.currencyCode,
      amount: order.totalAmount,
    });
    await this.repository.createPaymentTransaction({
      paymentIntentId: paymentIntent.id,
      type: "AUTHORIZATION",
      status: "PENDING",
      amount: order.totalAmount,
    });
    return this.getOrderPayments(orderId);
  }

  async getOrderPayments(orderId: string): Promise<PaymentView> {
    const intents = await this.repository.listPaymentIntentsByOrder(orderId);
    const paymentIntent = intents[0];
    if (!paymentIntent) throw new NotFoundException("Payment intent not found");
    const transactions = await this.repository.listPaymentTransactions(
      paymentIntent.id,
    );
    return { paymentIntent, transactions };
  }

  async listPaymentIntentsByTenant(tenantId: string) {
    return this.repository.listPaymentIntentsByTenant(tenantId);
  }

  async getPaymentIntent(paymentIntentId: string): Promise<PaymentView> {
    const paymentIntent =
      await this.repository.findPaymentIntentById(paymentIntentId);
    if (!paymentIntent) throw new NotFoundException("Payment intent not found");
    const transactions = await this.repository.listPaymentTransactions(
      paymentIntent.id,
    );
    return { paymentIntent, transactions };
  }

  async capturePayment(
    paymentIntentId: string,
    amount: number,
  ): Promise<PaymentView> {
    const paymentIntent =
      await this.repository.findPaymentIntentById(paymentIntentId);
    if (!paymentIntent) throw new NotFoundException("Payment intent not found");
    if (amount <= 0 || amount > paymentIntent.amount)
      throw new BadRequestException("Invalid capture amount");
    await this.repository.createPaymentCapture({
      paymentIntentId: paymentIntent.id,
      amount,
    });
    await this.repository.createPaymentTransaction({
      paymentIntentId: paymentIntent.id,
      type: "CAPTURE",
      status: "SUCCEEDED",
      amount,
    });
    await this.repository.updatePaymentIntentStatus(
      paymentIntent.id,
      "CAPTURED",
    );
    return this.getPaymentIntent(paymentIntent.id);
  }

  async refundPayment(
    paymentIntentId: string,
    amount: number,
    reason?: string | null,
  ): Promise<PaymentView> {
    const paymentIntent =
      await this.repository.findPaymentIntentById(paymentIntentId);
    if (!paymentIntent) throw new NotFoundException("Payment intent not found");
    if (amount <= 0 || amount > paymentIntent.amount)
      throw new BadRequestException("Invalid refund amount");
    await this.repository.createPaymentRefund({
      paymentIntentId: paymentIntent.id,
      amount,
      reason,
    });
    await this.repository.createPaymentTransaction({
      paymentIntentId: paymentIntent.id,
      type: "REFUND",
      status: "SUCCEEDED",
      amount,
    });
    await this.repository.updatePaymentIntentStatus(
      paymentIntent.id,
      "REFUNDED",
    );
    return this.getPaymentIntent(paymentIntent.id);
  }
}

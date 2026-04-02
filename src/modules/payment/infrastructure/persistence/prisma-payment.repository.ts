import { Injectable, NotFoundException } from "@nestjs/common";
import {
  PaymentIntentStatus,
  PaymentTransactionStatus,
  PaymentTransactionType,
} from "@prisma/client";

import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";

import {
  PaymentCaptureRecord,
  PaymentIntentRecord,
  PaymentRefundRecord,
  PaymentTransactionRecord,
  PaymentWebhookEventRecord,
} from "../../domain/entities/payment-records";
import { PaymentRepository } from "../../domain/repositories/payment.repository";

@Injectable()
export class PrismaPaymentRepository implements PaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findOrderById(orderId: string) {
    const order = await this.prisma.order
      .findUnique({ where: { id: orderId } })
      .catch(() => null);
    return order
      ? {
          id: order.id,
          tenantId: order.tenantId,
          storeId: order.storeId,
          customerId: order.customerId,
          currencyCode: order.currencyCode,
          totalAmount: order.totalAmount,
        }
      : null;
  }

  async createPaymentIntent(input: {
    tenantId: string;
    storeId: string;
    orderId: string;
    provider: string;
    currencyCode: string;
    amount: number;
  }): Promise<PaymentIntentRecord> {
    const intent = await this.prisma.paymentIntent.create({ data: input });
    return this.mapIntent(intent);
  }

  async listPaymentIntentsByOrder(
    orderId: string,
  ): Promise<PaymentIntentRecord[]> {
    const intents = await this.prisma.paymentIntent.findMany({
      where: { orderId },
      orderBy: { createdAt: "asc" },
    });
    return intents.map((intent) => this.mapIntent(intent));
  }

  async listPaymentIntentsByTenant(
    tenantId: string,
  ): Promise<PaymentIntentRecord[]> {
    const intents = await this.prisma.paymentIntent.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
    return intents.map((intent) => this.mapIntent(intent));
  }

  async findPaymentIntentById(
    paymentIntentId: string,
  ): Promise<PaymentIntentRecord | null> {
    const intent = await this.prisma.paymentIntent
      .findUnique({ where: { id: paymentIntentId } })
      .catch(() => null);
    return intent ? this.mapIntent(intent) : null;
  }

  async updatePaymentIntentStatus(
    paymentIntentId: string,
    status: "PENDING" | "AUTHORIZED" | "CAPTURED" | "FAILED" | "REFUNDED",
  ): Promise<PaymentIntentRecord> {
    const intent = await this.prisma.paymentIntent
      .update({
        where: { id: paymentIntentId },
        data: { status: status as PaymentIntentStatus },
      })
      .catch(() => {
        throw new NotFoundException("Payment intent not found");
      });
    return this.mapIntent(intent);
  }

  async createPaymentTransaction(input: {
    paymentIntentId: string;
    type: "AUTHORIZATION" | "CAPTURE" | "REFUND";
    status: "PENDING" | "SUCCEEDED" | "FAILED";
    amount: number;
    providerReference?: string | null;
  }): Promise<PaymentTransactionRecord> {
    const tx = await this.prisma.paymentTransaction.create({
      data: {
        paymentIntentId: input.paymentIntentId,
        type: input.type as PaymentTransactionType,
        status: input.status as PaymentTransactionStatus,
        amount: input.amount,
        providerReference: input.providerReference || null,
      },
    });
    return this.mapTransaction(tx);
  }

  async listPaymentTransactions(
    paymentIntentId: string,
  ): Promise<PaymentTransactionRecord[]> {
    const txs = await this.prisma.paymentTransaction.findMany({
      where: { paymentIntentId },
      orderBy: { createdAt: "asc" },
    });
    return txs.map((tx) => this.mapTransaction(tx));
  }

  async createPaymentCapture(input: {
    paymentIntentId: string;
    amount: number;
  }): Promise<PaymentCaptureRecord> {
    const capture = await this.prisma.paymentCapture.create({ data: input });
    return {
      id: capture.id,
      paymentIntentId: capture.paymentIntentId,
      amount: capture.amount,
    };
  }

  async createPaymentRefund(input: {
    paymentIntentId: string;
    amount: number;
    reason?: string | null;
  }): Promise<PaymentRefundRecord> {
    const refund = await this.prisma.paymentRefund.create({
      data: {
        paymentIntentId: input.paymentIntentId,
        amount: input.amount,
        reason: input.reason || null,
      },
    });
    return {
      id: refund.id,
      paymentIntentId: refund.paymentIntentId,
      amount: refund.amount,
      reason: refund.reason,
    };
  }

  async createPaymentWebhookEvent(input: {
    provider: string;
    eventType: string;
    providerReference?: string | null;
    payload: Record<string, unknown>;
    tenantId?: string | null;
  }): Promise<PaymentWebhookEventRecord> {
    const event = await this.prisma.paymentWebhookEvent.create({
      data: {
        provider: input.provider,
        eventType: input.eventType,
        providerReference: input.providerReference || null,
        payload: input.payload as any,
        tenantId: input.tenantId || null,
      },
    });
    return {
      id: event.id,
      provider: event.provider,
      eventType: event.eventType,
      providerReference: event.providerReference,
      payload: event.payload as Record<string, unknown>,
      processedAt: event.processedAt,
      tenantId: event.tenantId,
    };
  }

  private mapIntent(intent: {
    id: string;
    tenantId: string;
    storeId: string;
    orderId: string;
    provider: string;
    providerReference: string | null;
    status: PaymentIntentStatus;
    currencyCode: string;
    amount: number;
  }): PaymentIntentRecord {
    return {
      id: intent.id,
      tenantId: intent.tenantId,
      storeId: intent.storeId,
      orderId: intent.orderId,
      provider: intent.provider,
      providerReference: intent.providerReference,
      status: intent.status,
      currencyCode: intent.currencyCode,
      amount: intent.amount,
    };
  }

  private mapTransaction(tx: {
    id: string;
    paymentIntentId: string;
    type: PaymentTransactionType;
    status: PaymentTransactionStatus;
    providerReference: string | null;
    amount: number;
  }): PaymentTransactionRecord {
    return {
      id: tx.id,
      paymentIntentId: tx.paymentIntentId,
      type: tx.type,
      status: tx.status,
      providerReference: tx.providerReference,
      amount: tx.amount,
    };
  }
}

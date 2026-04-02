import { describe, expect, it } from "vitest";

import { PaymentService } from "src/modules/payment/application/services/payment.service";
import { PaymentRepository } from "src/modules/payment/domain/repositories/payment.repository";
import {
  PaymentCaptureRecord,
  PaymentIntentRecord,
  PaymentRefundRecord,
  PaymentTransactionRecord,
  PaymentWebhookEventRecord,
} from "src/modules/payment/domain/entities/payment-records";

class InMemoryPaymentRepository implements PaymentRepository {
  intent: PaymentIntentRecord | null = null;
  transactions: PaymentTransactionRecord[] = [];
  async findOrderById(orderId: string) {
    return orderId === "order-1"
      ? {
          id: "order-1",
          tenantId: "tenant-1",
          storeId: "store-1",
          customerId: "customer-1",
          currencyCode: "USD",
          totalAmount: 2000,
        }
      : null;
  }
  async createPaymentIntent(input: any) {
    const intent = {
      id: "payment-1",
      status: "PENDING",
      providerReference: null,
      ...input,
    } as PaymentIntentRecord;
    this.intent = intent;
    return intent;
  }
  async listPaymentIntentsByOrder(orderId: string) {
    return this.intent && this.intent.orderId === orderId ? [this.intent] : [];
  }
  async listPaymentIntentsByTenant(tenantId: string) {
    return this.intent && this.intent.tenantId === tenantId
      ? [this.intent]
      : [];
  }
  async findPaymentIntentById(paymentIntentId: string) {
    return this.intent && this.intent.id === paymentIntentId
      ? this.intent
      : null;
  }
  async updatePaymentIntentStatus(paymentIntentId: string, status: any) {
    this.intent = { ...this.intent!, status };
    return this.intent!;
  }
  async createPaymentTransaction(input: any) {
    const tx = {
      id: `tx-${this.transactions.length + 1}`,
      providerReference: null,
      ...input,
    } as PaymentTransactionRecord;
    this.transactions.push(tx);
    return tx;
  }
  async listPaymentTransactions(paymentIntentId: string) {
    return this.transactions.filter(
      (tx) => tx.paymentIntentId === paymentIntentId,
    );
  }
  async createPaymentCapture() {
    return {
      id: "capture-1",
      paymentIntentId: "payment-1",
      amount: 1000,
    } as PaymentCaptureRecord;
  }
  async createPaymentRefund() {
    return {
      id: "refund-1",
      paymentIntentId: "payment-1",
      amount: 500,
      reason: "requested",
    } as PaymentRefundRecord;
  }
  async createPaymentWebhookEvent() {
    return {
      id: "webhook-1",
      provider: "manual",
      eventType: "payment.updated",
      providerReference: null,
      payload: {},
      processedAt: null,
      tenantId: null,
    } as PaymentWebhookEventRecord;
  }
}

describe("Payment unit tests", () => {
  it("creates payment intent for order", async () => {
    const service = new PaymentService(new InMemoryPaymentRepository());
    const result = await service.createPaymentIntent("customer-1", "order-1", {
      provider: "manual",
    });
    expect(result.paymentIntent.orderId).toBe("order-1");
  });

  it("rejects payment intent for missing order", async () => {
    const service = new PaymentService(new InMemoryPaymentRepository());
    await expect(
      service.createPaymentIntent("customer-1", "missing-order", {
        provider: "manual",
      }),
    ).rejects.toThrow("Order not found");
  });

  it("records payment transaction state", async () => {
    const service = new PaymentService(new InMemoryPaymentRepository());
    const result = await service.createPaymentIntent("customer-1", "order-1", {
      provider: "manual",
    });
    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].type).toBe("AUTHORIZATION");
  });

  it("captures payment with valid amount", async () => {
    const service = new PaymentService(new InMemoryPaymentRepository());
    await service.createPaymentIntent("customer-1", "order-1", {
      provider: "manual",
    });
    const result = await service.capturePayment("payment-1", 1000);
    expect(result.paymentIntent.status).toBe("CAPTURED");
  });

  it("refunds payment with valid amount", async () => {
    const service = new PaymentService(new InMemoryPaymentRepository());
    await service.createPaymentIntent("customer-1", "order-1", {
      provider: "manual",
    });
    const result = await service.refundPayment("payment-1", 500, "requested");
    expect(result.paymentIntent.status).toBe("REFUNDED");
  });
});

import {
  PaymentCaptureRecord,
  PaymentIntentRecord,
  PaymentRefundRecord,
  PaymentTransactionRecord,
  PaymentView,
  PaymentWebhookEventRecord,
} from "../entities/payment-records";

export interface PaymentRepository {
  findOrderById(orderId: string): Promise<{
    id: string;
    tenantId: string;
    storeId: string;
    customerId: string | null;
    currencyCode: string;
    totalAmount: number;
  } | null>;
  createPaymentIntent(input: {
    tenantId: string;
    storeId: string;
    orderId: string;
    provider: string;
    currencyCode: string;
    amount: number;
  }): Promise<PaymentIntentRecord>;
  listPaymentIntentsByOrder(orderId: string): Promise<PaymentIntentRecord[]>;
  listPaymentIntentsByTenant(tenantId: string): Promise<PaymentIntentRecord[]>;
  findPaymentIntentById(
    paymentIntentId: string,
  ): Promise<PaymentIntentRecord | null>;
  updatePaymentIntentStatus(
    paymentIntentId: string,
    status: "PENDING" | "AUTHORIZED" | "CAPTURED" | "FAILED" | "REFUNDED",
  ): Promise<PaymentIntentRecord>;
  createPaymentTransaction(input: {
    paymentIntentId: string;
    type: "AUTHORIZATION" | "CAPTURE" | "REFUND";
    status: "PENDING" | "SUCCEEDED" | "FAILED";
    amount: number;
    providerReference?: string | null;
  }): Promise<PaymentTransactionRecord>;
  listPaymentTransactions(
    paymentIntentId: string,
  ): Promise<PaymentTransactionRecord[]>;
  createPaymentCapture(input: {
    paymentIntentId: string;
    amount: number;
  }): Promise<PaymentCaptureRecord>;
  createPaymentRefund(input: {
    paymentIntentId: string;
    amount: number;
    reason?: string | null;
  }): Promise<PaymentRefundRecord>;
  createPaymentWebhookEvent(input: {
    provider: string;
    eventType: string;
    providerReference?: string | null;
    payload: Record<string, unknown>;
    tenantId?: string | null;
  }): Promise<PaymentWebhookEventRecord>;
}

export type PaymentIntentRecord = {
  id: string;
  tenantId: string;
  storeId: string;
  orderId: string;
  provider: string;
  providerReference: string | null;
  status: "PENDING" | "AUTHORIZED" | "CAPTURED" | "FAILED" | "REFUNDED";
  currencyCode: string;
  amount: number;
};

export type PaymentTransactionRecord = {
  id: string;
  paymentIntentId: string;
  type: "AUTHORIZATION" | "CAPTURE" | "REFUND";
  status: "PENDING" | "SUCCEEDED" | "FAILED";
  providerReference: string | null;
  amount: number;
};

export type PaymentCaptureRecord = {
  id: string;
  paymentIntentId: string;
  amount: number;
};

export type PaymentRefundRecord = {
  id: string;
  paymentIntentId: string;
  amount: number;
  reason: string | null;
};

export type PaymentWebhookEventRecord = {
  id: string;
  provider: string;
  eventType: string;
  providerReference: string | null;
  payload: Record<string, unknown>;
  processedAt: Date | null;
  tenantId: string | null;
};

export type PaymentView = {
  paymentIntent: PaymentIntentRecord;
  transactions: PaymentTransactionRecord[];
};

export type OrderRecord = {
  id: string;
  tenantId: string;
  storeId: string;
  checkoutId: string;
  customerId: string | null;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "FULFILLED";
  currencyCode: string;
  subtotalAmount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
};

export type OrderItemRecord = {
  id: string;
  orderId: string;
  variantId: string;
  quantity: number;
  unitAmountSnapshot: number;
  currencyCode: string;
};

export type OrderAddressRecord = {
  id: string;
  orderId: string;
  type: string;
  firstName: string;
  lastName: string;
  line1: string;
  line2: string | null;
  city: string;
  region: string | null;
  postalCode: string;
  countryCode: string;
  phone: string | null;
};

export type OrderStatusHistoryRecord = {
  id: string;
  orderId: string;
  fromStatus: "PENDING" | "CONFIRMED" | "CANCELLED" | "FULFILLED" | null;
  toStatus: "PENDING" | "CONFIRMED" | "CANCELLED" | "FULFILLED";
  actorUserId: string | null;
};

export type OrderNoteRecord = {
  id: string;
  orderId: string;
  authorUserId: string;
  content: string;
};

export type OrderView = {
  order: OrderRecord;
  items: OrderItemRecord[];
  addresses: OrderAddressRecord[];
  statusHistory: OrderStatusHistoryRecord[];
  notes: OrderNoteRecord[];
};

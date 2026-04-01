export type CartRecord = {
  id: string;
  tenantId: string;
  storeId: string;
  customerId: string | null;
  guestToken: string | null;
  status: "ACTIVE" | "ABANDONED";
};

export type CartItemRecord = {
  id: string;
  cartId: string;
  variantId: string;
  quantity: number;
  unitAmountSnapshot: number;
  currencyCode: string;
};

export type CartTotalRecord = {
  cartId: string;
  subtotalAmount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  currencyCode: string;
};

export type CartView = {
  cart: CartRecord;
  items: CartItemRecord[];
  totals: CartTotalRecord;
};

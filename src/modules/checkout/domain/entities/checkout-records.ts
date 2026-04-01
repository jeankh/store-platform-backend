export type CheckoutRecord = {
  id: string;
  tenantId: string;
  storeId: string;
  cartId: string;
  customerId: string | null;
  status: "ACTIVE" | "COMPLETED" | "ABANDONED";
};

export type CheckoutItemRecord = {
  id: string;
  checkoutId: string;
  variantId: string;
  quantity: number;
  unitAmountSnapshot: number;
  currencyCode: string;
};

export type CheckoutAddressRecord = {
  id: string;
  checkoutId: string;
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

export type CheckoutView = {
  checkout: CheckoutRecord;
  items: CheckoutItemRecord[];
  addresses: CheckoutAddressRecord[];
};

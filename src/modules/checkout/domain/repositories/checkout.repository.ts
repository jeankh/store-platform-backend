import {
  CheckoutAddressRecord,
  CheckoutItemRecord,
  CheckoutRecord,
  CheckoutView,
} from "../entities/checkout-records";

export interface CheckoutRepository {
  findCartSnapshot(
    cartId: string,
  ): Promise<{
    cart: {
      id: string;
      tenantId: string;
      storeId: string;
      customerId: string | null;
    };
    items: Array<{
      variantId: string;
      quantity: number;
      unitAmountSnapshot: number;
      currencyCode: string;
    }>;
  } | null>;
  createCheckout(input: {
    tenantId: string;
    storeId: string;
    cartId: string;
    customerId?: string | null;
  }): Promise<CheckoutRecord>;
  createCheckoutItems(
    checkoutId: string,
    items: Array<{
      variantId: string;
      quantity: number;
      unitAmountSnapshot: number;
      currencyCode: string;
    }>,
  ): Promise<CheckoutItemRecord[]>;
  listCheckoutItems(checkoutId: string): Promise<CheckoutItemRecord[]>;
  findCheckoutById(checkoutId: string): Promise<CheckoutRecord | null>;
  listCheckoutAddresses(checkoutId: string): Promise<CheckoutAddressRecord[]>;
  upsertCheckoutAddress(input: {
    checkoutId: string;
    type: string;
    firstName: string;
    lastName: string;
    line1: string;
    line2?: string | null;
    city: string;
    region?: string | null;
    postalCode: string;
    countryCode: string;
    phone?: string | null;
  }): Promise<CheckoutAddressRecord>;
  getCheckoutView(checkoutId: string): Promise<CheckoutView | null>;
}

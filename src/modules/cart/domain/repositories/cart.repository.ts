import {
  CartItemRecord,
  CartRecord,
  CartTotalRecord,
  CartView,
} from "../entities/cart-records";

export type CreateCartInput = {
  tenantId: string;
  storeId: string;
  customerId?: string | null;
  guestToken?: string | null;
};

export interface CartRepository {
  createCart(input: CreateCartInput): Promise<CartRecord>;
  findCartById(cartId: string): Promise<CartRecord | null>;
  listCartItems(cartId: string): Promise<CartItemRecord[]>;
  createCartItem(input: {
    cartId: string;
    variantId: string;
    quantity: number;
    unitAmountSnapshot: number;
    currencyCode: string;
  }): Promise<CartItemRecord>;
  updateCartItem(input: {
    itemId: string;
    quantity: number;
  }): Promise<CartItemRecord>;
  deleteCartItem(itemId: string): Promise<void>;
  upsertCartTotals(input: {
    cartId: string;
    subtotalAmount: number;
    discountAmount: number;
    taxAmount: number;
    totalAmount: number;
    currencyCode: string;
  }): Promise<CartTotalRecord>;
  getCartTotals(cartId: string): Promise<CartTotalRecord | null>;
  findVariantForCart(
    variantId: string,
  ): Promise<{
    id: string;
    sku: string;
    product: {
      tenantId: string;
      storeId: string;
      status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    };
    prices: Array<{ currencyCode: string; amount: number }>;
    stockItems: Array<{ levels: Array<{ availableQuantity: number }> }>;
  } | null>;
  getCartView(cartId: string): Promise<CartView | null>;
}

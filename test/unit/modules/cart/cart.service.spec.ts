import { describe, expect, it } from "vitest";

import { CartService } from "src/modules/cart/application/services/cart.service";
import { CartRepository } from "src/modules/cart/domain/repositories/cart.repository";
import {
  CartItemRecord,
  CartRecord,
  CartTotalRecord,
  CartView,
} from "src/modules/cart/domain/entities/cart-records";

class InMemoryCartRepository implements CartRepository {
  cart: CartRecord | null = null;
  items: CartItemRecord[] = [];
  totals: CartTotalRecord | null = null;
  variant: any = {
    id: "variant-1",
    prices: [{ currencyCode: "USD", amount: 1000 }],
    product: { tenantId: "tenant-1", storeId: "store-1", status: "PUBLISHED" },
    stockItems: [{ levels: [{ availableQuantity: 10 }] }],
  };
  async createCart(input: any): Promise<CartRecord> {
    const cart: CartRecord = {
      id: "cart-1",
      customerId: null,
      guestToken: null,
      status: "ACTIVE",
      ...input,
    };
    this.cart = cart;
    return cart;
  }
  async findCartById(cartId: string) {
    return this.cart && this.cart.id === cartId ? this.cart : null;
  }
  async listCartItems() {
    return this.items;
  }
  async createCartItem(input: any) {
    const item = { id: `item-${this.items.length + 1}`, ...input };
    this.items.push(item);
    return item;
  }
  async updateCartItem(input: any) {
    const idx = this.items.findIndex((item) => item.id === input.itemId);
    this.items[idx] = { ...this.items[idx], quantity: input.quantity };
    return this.items[idx];
  }
  async deleteCartItem(itemId: string) {
    this.items = this.items.filter((item) => item.id !== itemId);
  }
  async upsertCartTotals(input: any) {
    this.totals = input;
    return input;
  }
  async getCartTotals() {
    return this.totals;
  }
  async findVariantForCart(variantId: string) {
    return variantId === "variant-1" ? this.variant : null;
  }
  async getCartView(cartId: string) {
    return this.cart && this.totals
      ? ({
          cart: this.cart,
          items: this.items,
          totals: this.totals,
        } as CartView)
      : null;
  }
}

describe("Cart unit tests", () => {
  it("creates guest cart", async () => {
    const service = new CartService(new InMemoryCartRepository());
    const cart = await service.createGuestCart({
      tenantId: "tenant-1",
      storeId: "store-1",
    });
    expect(cart.cart.guestToken).toBeTruthy();
  });

  it("adds item to cart with valid variant", async () => {
    const repository = new InMemoryCartRepository();
    const service = new CartService(repository);
    await service.createGuestCart({ tenantId: "tenant-1", storeId: "store-1" });
    const cart = await service.addItem("cart-1", {
      variantId: "variant-1",
      quantity: 2,
    });
    expect(cart.items).toHaveLength(1);
    expect(cart.totals.totalAmount).toBe(2000);
  });

  it("rejects item add when variant is unavailable or missing", async () => {
    const repository = new InMemoryCartRepository();
    const service = new CartService(repository);
    await service.createGuestCart({ tenantId: "tenant-1", storeId: "store-1" });
    await expect(
      service.addItem("cart-1", { variantId: "missing", quantity: 1 }),
    ).rejects.toThrow("Variant not found");
    repository.variant.stockItems[0].levels[0].availableQuantity = 0;
    await expect(
      service.addItem("cart-1", { variantId: "variant-1", quantity: 1 }),
    ).rejects.toThrow("Variant is unavailable");
  });

  it("updates item quantity correctly", async () => {
    const repository = new InMemoryCartRepository();
    const service = new CartService(repository);
    await service.createGuestCart({ tenantId: "tenant-1", storeId: "store-1" });
    await service.addItem("cart-1", { variantId: "variant-1", quantity: 1 });
    const cart = await service.updateItem("cart-1", "item-1", 3);
    expect(cart.items[0].quantity).toBe(3);
    expect(cart.totals.totalAmount).toBe(3000);
  });

  it("removes item from cart", async () => {
    const repository = new InMemoryCartRepository();
    const service = new CartService(repository);
    await service.createGuestCart({ tenantId: "tenant-1", storeId: "store-1" });
    await service.addItem("cart-1", { variantId: "variant-1", quantity: 1 });
    const cart = await service.removeItem("cart-1", "item-1");
    expect(cart.items).toHaveLength(0);
    expect(cart.totals.totalAmount).toBe(0);
  });
});

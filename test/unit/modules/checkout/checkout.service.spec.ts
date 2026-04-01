import { describe, expect, it } from "vitest";

import { CheckoutService } from "src/modules/checkout/application/services/checkout.service";
import {
  CheckoutAddressRecord,
  CheckoutItemRecord,
  CheckoutRecord,
  CheckoutView,
} from "src/modules/checkout/domain/entities/checkout-records";
import { CheckoutRepository } from "src/modules/checkout/domain/repositories/checkout.repository";

class InMemoryCheckoutRepository implements CheckoutRepository {
  checkout: CheckoutRecord | null = null;
  items: CheckoutItemRecord[] = [];
  addresses: CheckoutAddressRecord[] = [];
  async findCartSnapshot(cartId: string) {
    return cartId === "cart-1"
      ? {
          cart: {
            id: "cart-1",
            tenantId: "tenant-1",
            storeId: "store-1",
            customerId: null,
          },
          items: [
            {
              variantId: "variant-1",
              quantity: 2,
              unitAmountSnapshot: 1000,
              currencyCode: "USD",
            },
          ],
        }
      : null;
  }
  async createCheckout(input: any): Promise<CheckoutRecord> {
    const checkout: CheckoutRecord = {
      id: "checkout-1",
      customerId: null,
      status: "ACTIVE",
      ...input,
    };
    this.checkout = checkout;
    return checkout;
  }
  async createCheckoutItems(checkoutId: string, items: any[]) {
    this.items = items.map((item, index) => ({
      id: `item-${index + 1}`,
      checkoutId,
      ...item,
    }));
    return this.items;
  }
  async listCheckoutItems() {
    return this.items;
  }
  async findCheckoutById(checkoutId: string) {
    return this.checkout && this.checkout.id === checkoutId
      ? this.checkout
      : null;
  }
  async listCheckoutAddresses() {
    return this.addresses;
  }
  async upsertCheckoutAddress(input: any) {
    const existingIndex = this.addresses.findIndex(
      (address) => address.type === input.type,
    );
    const next = {
      id:
        existingIndex >= 0
          ? this.addresses[existingIndex].id
          : `address-${this.addresses.length + 1}`,
      ...input,
    };
    if (existingIndex >= 0) this.addresses[existingIndex] = next;
    else this.addresses.push(next);
    return next;
  }
  async getCheckoutView(checkoutId: string) {
    return this.checkout && this.checkout.id === checkoutId
      ? ({
          checkout: this.checkout,
          items: this.items,
          addresses: this.addresses,
        } as CheckoutView)
      : null;
  }
}

describe("Checkout unit tests", () => {
  it("creates checkout from cart", async () => {
    const service = new CheckoutService(new InMemoryCheckoutRepository());
    const checkout = await service.createCheckout({ cartId: "cart-1" });
    expect(checkout.checkout.id).toBe("checkout-1");
    expect(checkout.items).toHaveLength(1);
  });

  it("persists shipping and billing data in checkout", async () => {
    const service = new CheckoutService(new InMemoryCheckoutRepository());
    await service.createCheckout({ cartId: "cart-1" });
    const updated = await service.updateCheckout("checkout-1", {
      shippingAddress: {
        firstName: "John",
        lastName: "Doe",
        line1: "123 Street",
        city: "Paris",
        postalCode: "75001",
        countryCode: "FR",
      },
      billingAddress: {
        firstName: "Jane",
        lastName: "Doe",
        line1: "456 Street",
        city: "Paris",
        postalCode: "75002",
        countryCode: "FR",
      },
    });
    expect(updated.addresses).toHaveLength(2);
  });

  it("returns checkout review snapshot", async () => {
    const service = new CheckoutService(new InMemoryCheckoutRepository());
    await service.createCheckout({ cartId: "cart-1" });
    const checkout = await service.getCheckout("checkout-1");
    expect(checkout.items[0].unitAmountSnapshot).toBe(1000);
  });
});

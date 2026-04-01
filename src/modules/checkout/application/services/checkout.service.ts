import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { CheckoutView } from "../../domain/entities/checkout-records";
import { CheckoutRepository } from "../../domain/repositories/checkout.repository";
import { CHECKOUT_REPOSITORY } from "../../domain/repositories/checkout.repository.token";

@Injectable()
export class CheckoutService {
  constructor(
    @Inject(CHECKOUT_REPOSITORY)
    private readonly repository: CheckoutRepository,
  ) {}

  async createCheckout(input: { cartId: string }): Promise<CheckoutView> {
    const snapshot = await this.repository.findCartSnapshot(input.cartId);
    if (!snapshot) throw new NotFoundException("Cart not found");
    if (snapshot.items.length === 0)
      throw new BadRequestException("Cart is empty");
    const checkout = await this.repository.createCheckout({
      tenantId: snapshot.cart.tenantId,
      storeId: snapshot.cart.storeId,
      cartId: snapshot.cart.id,
      customerId: snapshot.cart.customerId,
    });
    await this.repository.createCheckoutItems(checkout.id, snapshot.items);
    return this.getCheckout(checkout.id);
  }

  async getCheckout(checkoutId: string): Promise<CheckoutView> {
    const checkout = await this.repository.getCheckoutView(checkoutId);
    if (!checkout) throw new NotFoundException("Checkout not found");
    return checkout;
  }

  async updateCheckout(
    checkoutId: string,
    input: {
      shippingAddress?: {
        firstName: string;
        lastName: string;
        line1: string;
        line2?: string | null;
        city: string;
        region?: string | null;
        postalCode: string;
        countryCode: string;
        phone?: string | null;
      };
      billingAddress?: {
        firstName: string;
        lastName: string;
        line1: string;
        line2?: string | null;
        city: string;
        region?: string | null;
        postalCode: string;
        countryCode: string;
        phone?: string | null;
      };
    },
  ): Promise<CheckoutView> {
    const checkout = await this.repository.findCheckoutById(checkoutId);
    if (!checkout) throw new NotFoundException("Checkout not found");
    if (input.shippingAddress) {
      await this.repository.upsertCheckoutAddress({
        checkoutId,
        type: "shipping",
        ...input.shippingAddress,
      });
    }
    if (input.billingAddress) {
      await this.repository.upsertCheckoutAddress({
        checkoutId,
        type: "billing",
        ...input.billingAddress,
      });
    }
    return this.getCheckout(checkoutId);
  }
}

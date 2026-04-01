import { Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";

import {
  CheckoutAddressRecord,
  CheckoutItemRecord,
  CheckoutRecord,
  CheckoutView,
} from "../../domain/entities/checkout-records";
import { CheckoutRepository } from "../../domain/repositories/checkout.repository";

@Injectable()
export class PrismaCheckoutRepository implements CheckoutRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findCartSnapshot(cartId: string) {
    const cart = await this.prisma.cart
      .findUnique({ where: { id: cartId }, include: { items: true } })
      .catch(() => null);
    if (!cart) return null;
    return {
      cart: {
        id: cart.id,
        tenantId: cart.tenantId,
        storeId: cart.storeId,
        customerId: cart.customerId,
      },
      items: cart.items.map((item) => ({
        variantId: item.variantId,
        quantity: item.quantity,
        unitAmountSnapshot: item.unitAmountSnapshot,
        currencyCode: item.currencyCode,
      })),
    };
  }

  async createCheckout(input: {
    tenantId: string;
    storeId: string;
    cartId: string;
    customerId?: string | null;
  }): Promise<CheckoutRecord> {
    const checkout = await this.prisma.checkout.create({ data: input });
    return this.mapCheckout(checkout);
  }

  async createCheckoutItems(
    checkoutId: string,
    items: Array<{
      variantId: string;
      quantity: number;
      unitAmountSnapshot: number;
      currencyCode: string;
    }>,
  ): Promise<CheckoutItemRecord[]> {
    const created = [] as CheckoutItemRecord[];
    for (const item of items) {
      const createdItem = await this.prisma.checkoutItem.create({
        data: { checkoutId, ...item },
      });
      created.push(this.mapItem(createdItem));
    }
    return created;
  }

  async listCheckoutItems(checkoutId: string): Promise<CheckoutItemRecord[]> {
    const items = await this.prisma.checkoutItem.findMany({
      where: { checkoutId },
      orderBy: { createdAt: "asc" },
    });
    return items.map((item) => this.mapItem(item));
  }

  async findCheckoutById(checkoutId: string): Promise<CheckoutRecord | null> {
    const checkout = await this.prisma.checkout
      .findUnique({ where: { id: checkoutId } })
      .catch(() => null);
    return checkout ? this.mapCheckout(checkout) : null;
  }

  async listCheckoutAddresses(
    checkoutId: string,
  ): Promise<CheckoutAddressRecord[]> {
    const addresses = await this.prisma.checkoutAddress.findMany({
      where: { checkoutId },
      orderBy: { createdAt: "asc" },
    });
    return addresses.map((address) => this.mapAddress(address));
  }

  async upsertCheckoutAddress(input: {
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
  }): Promise<CheckoutAddressRecord> {
    const existing = await this.prisma.checkoutAddress.findFirst({
      where: { checkoutId: input.checkoutId, type: input.type },
    });
    const address = existing
      ? await this.prisma.checkoutAddress.update({
          where: { id: existing.id },
          data: input,
        })
      : await this.prisma.checkoutAddress.create({ data: input });
    return this.mapAddress(address);
  }

  async getCheckoutView(checkoutId: string): Promise<CheckoutView | null> {
    const checkout = await this.findCheckoutById(checkoutId);
    if (!checkout) return null;
    const items = await this.listCheckoutItems(checkoutId);
    const addresses = await this.listCheckoutAddresses(checkoutId);
    return { checkout, items, addresses };
  }

  private mapCheckout(checkout: {
    id: string;
    tenantId: string;
    storeId: string;
    cartId: string;
    customerId: string | null;
    status: "ACTIVE" | "COMPLETED" | "ABANDONED";
  }): CheckoutRecord {
    return {
      id: checkout.id,
      tenantId: checkout.tenantId,
      storeId: checkout.storeId,
      cartId: checkout.cartId,
      customerId: checkout.customerId,
      status: checkout.status,
    };
  }

  private mapItem(item: {
    id: string;
    checkoutId: string;
    variantId: string;
    quantity: number;
    unitAmountSnapshot: number;
    currencyCode: string;
  }): CheckoutItemRecord {
    return {
      id: item.id,
      checkoutId: item.checkoutId,
      variantId: item.variantId,
      quantity: item.quantity,
      unitAmountSnapshot: item.unitAmountSnapshot,
      currencyCode: item.currencyCode,
    };
  }

  private mapAddress(address: {
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
  }): CheckoutAddressRecord {
    return {
      id: address.id,
      checkoutId: address.checkoutId,
      type: address.type,
      firstName: address.firstName,
      lastName: address.lastName,
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      region: address.region,
      postalCode: address.postalCode,
      countryCode: address.countryCode,
      phone: address.phone,
    };
  }
}

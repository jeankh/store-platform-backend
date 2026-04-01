import { Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";

import {
  CartItemRecord,
  CartRecord,
  CartTotalRecord,
  CartView,
} from "../../domain/entities/cart-records";
import {
  CartRepository,
  CreateCartInput,
} from "../../domain/repositories/cart.repository";

@Injectable()
export class PrismaCartRepository implements CartRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createCart(input: CreateCartInput): Promise<CartRecord> {
    const cart = await this.prisma.cart.create({ data: input });
    return this.mapCart(cart);
  }

  async findCartById(cartId: string): Promise<CartRecord | null> {
    const cart = await this.prisma.cart
      .findUnique({ where: { id: cartId } })
      .catch(() => null);
    return cart ? this.mapCart(cart) : null;
  }

  async listCartItems(cartId: string): Promise<CartItemRecord[]> {
    const items = await this.prisma.cartItem.findMany({
      where: { cartId },
      orderBy: { createdAt: "asc" },
    });
    return items.map((item) => this.mapItem(item));
  }

  async createCartItem(input: {
    cartId: string;
    variantId: string;
    quantity: number;
    unitAmountSnapshot: number;
    currencyCode: string;
  }): Promise<CartItemRecord> {
    const item = await this.prisma.cartItem.create({ data: input });
    return this.mapItem(item);
  }

  async updateCartItem(input: {
    itemId: string;
    quantity: number;
  }): Promise<CartItemRecord> {
    const item = await this.prisma.cartItem
      .update({
        where: { id: input.itemId },
        data: { quantity: input.quantity },
      })
      .catch(() => {
        throw new NotFoundException("Cart item not found");
      });
    return this.mapItem(item);
  }

  async deleteCartItem(itemId: string): Promise<void> {
    await this.prisma.cartItem.delete({ where: { id: itemId } });
  }

  async upsertCartTotals(input: {
    cartId: string;
    subtotalAmount: number;
    discountAmount: number;
    taxAmount: number;
    totalAmount: number;
    currencyCode: string;
  }): Promise<CartTotalRecord> {
    const totals = await this.prisma.cartTotal.upsert({
      where: { cartId: input.cartId },
      update: input,
      create: input,
    });
    return this.mapTotals(totals);
  }

  async getCartTotals(cartId: string): Promise<CartTotalRecord | null> {
    const totals = await this.prisma.cartTotal.findUnique({
      where: { cartId },
    });
    return totals ? this.mapTotals(totals) : null;
  }

  async findVariantForCart(variantId: string) {
    return this.prisma.productVariant
      .findUnique({
        where: { id: variantId },
        include: {
          product: { select: { tenantId: true, storeId: true, status: true } },
          prices: { orderBy: { createdAt: "asc" } },
          stockItems: { include: { levels: true } },
        },
      })
      .catch(() => null);
  }

  async getCartView(cartId: string): Promise<CartView | null> {
    const cart = await this.findCartById(cartId);
    if (!cart) return null;
    const items = await this.listCartItems(cartId);
    const totals = await this.getCartTotals(cartId);
    return totals ? { cart, items, totals } : null;
  }

  private mapCart(cart: {
    id: string;
    tenantId: string;
    storeId: string;
    customerId: string | null;
    guestToken: string | null;
    status: "ACTIVE" | "ABANDONED";
  }): CartRecord {
    return {
      id: cart.id,
      tenantId: cart.tenantId,
      storeId: cart.storeId,
      customerId: cart.customerId,
      guestToken: cart.guestToken,
      status: cart.status,
    };
  }

  private mapItem(item: {
    id: string;
    cartId: string;
    variantId: string;
    quantity: number;
    unitAmountSnapshot: number;
    currencyCode: string;
  }): CartItemRecord {
    return {
      id: item.id,
      cartId: item.cartId,
      variantId: item.variantId,
      quantity: item.quantity,
      unitAmountSnapshot: item.unitAmountSnapshot,
      currencyCode: item.currencyCode,
    };
  }

  private mapTotals(totals: {
    cartId: string;
    subtotalAmount: number;
    discountAmount: number;
    taxAmount: number;
    totalAmount: number;
    currencyCode: string;
  }): CartTotalRecord {
    return {
      cartId: totals.cartId,
      subtotalAmount: totals.subtotalAmount,
      discountAmount: totals.discountAmount,
      taxAmount: totals.taxAmount,
      totalAmount: totals.totalAmount,
      currencyCode: totals.currencyCode,
    };
  }
}

import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";

import { CartView } from "../../domain/entities/cart-records";
import { CartRepository } from "../../domain/repositories/cart.repository";
import { CART_REPOSITORY } from "../../domain/repositories/cart.repository.token";

@Injectable()
export class CartService {
  constructor(
    @Inject(CART_REPOSITORY) private readonly repository: CartRepository,
  ) {}

  async createGuestCart(input: {
    tenantId: string;
    storeId: string;
  }): Promise<CartView> {
    const cart = await this.repository.createCart({
      tenantId: input.tenantId,
      storeId: input.storeId,
      guestToken: randomUUID(),
    });
    await this.repository.upsertCartTotals({
      cartId: cart.id,
      subtotalAmount: 0,
      discountAmount: 0,
      taxAmount: 0,
      totalAmount: 0,
      currencyCode: "USD",
    });
    return this.getCart(cart.id);
  }

  async getCart(cartId: string): Promise<CartView> {
    const cart = await this.repository.getCartView(cartId);
    if (!cart) throw new NotFoundException("Cart not found");
    return cart;
  }

  async addItem(
    cartId: string,
    input: { variantId: string; quantity: number },
  ) {
    if (input.quantity <= 0)
      throw new BadRequestException("Quantity must be greater than zero");
    const cart = await this.repository.findCartById(cartId);
    if (!cart) throw new NotFoundException("Cart not found");
    const variant = await this.repository.findVariantForCart(input.variantId);
    if (!variant || variant.product.status !== "PUBLISHED")
      throw new NotFoundException("Variant not found");
    const firstPrice = variant.prices[0];
    if (!firstPrice) throw new ConflictException("Variant has no price");
    const availableQuantity = variant.stockItems
      .flatMap((stockItem) => stockItem.levels)
      .reduce((sum, level) => sum + level.availableQuantity, 0);
    if (availableQuantity < input.quantity)
      throw new ConflictException("Variant is unavailable");
    await this.repository.createCartItem({
      cartId: cart.id,
      variantId: variant.id,
      quantity: input.quantity,
      unitAmountSnapshot: firstPrice.amount,
      currencyCode: firstPrice.currencyCode,
    });
    await this.recalculateTotals(cart.id);
    return this.getCart(cart.id);
  }

  async updateItem(cartId: string, itemId: string, quantity: number) {
    if (quantity <= 0)
      throw new BadRequestException("Quantity must be greater than zero");
    const cart = await this.repository.findCartById(cartId);
    if (!cart) throw new NotFoundException("Cart not found");
    await this.repository.updateCartItem({ itemId, quantity });
    await this.recalculateTotals(cart.id);
    return this.getCart(cart.id);
  }

  async removeItem(cartId: string, itemId: string) {
    const cart = await this.repository.findCartById(cartId);
    if (!cart) throw new NotFoundException("Cart not found");
    await this.repository.deleteCartItem(itemId);
    await this.recalculateTotals(cart.id);
    return this.getCart(cart.id);
  }

  private async recalculateTotals(cartId: string) {
    const items = await this.repository.listCartItems(cartId);
    const subtotalAmount = items.reduce(
      (sum, item) => sum + item.unitAmountSnapshot * item.quantity,
      0,
    );
    const currencyCode = items[0]?.currencyCode || "USD";
    await this.repository.upsertCartTotals({
      cartId,
      subtotalAmount,
      discountAmount: 0,
      taxAmount: 0,
      totalAmount: subtotalAmount,
      currencyCode,
    });
  }
}

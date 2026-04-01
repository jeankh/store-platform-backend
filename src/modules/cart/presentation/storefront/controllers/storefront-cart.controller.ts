import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from "@nestjs/common";

import { CartService } from "../../../application/services/cart.service";
import { CreateCartItemDto } from "../dto/create-cart-item.dto";
import { CreateCartDto } from "../dto/create-cart.dto";
import { UpdateCartItemDto } from "../dto/update-cart-item.dto";

@Controller("storefront/carts")
export class StorefrontCartController {
  constructor(@Inject(CartService) private readonly cartService: CartService) {}

  @Post()
  createCart(@Body() body: CreateCartDto) {
    return this.cartService.createGuestCart(body);
  }

  @Get(":cartId")
  getCart(@Param("cartId", new ParseUUIDPipe()) cartId: string) {
    return this.cartService.getCart(cartId);
  }

  @Post(":cartId/items")
  addItem(
    @Param("cartId", new ParseUUIDPipe()) cartId: string,
    @Body() body: CreateCartItemDto,
  ) {
    return this.cartService.addItem(cartId, body);
  }

  @Patch(":cartId/items/:itemId")
  updateItem(
    @Param("cartId", new ParseUUIDPipe()) cartId: string,
    @Param("itemId", new ParseUUIDPipe()) itemId: string,
    @Body() body: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(cartId, itemId, body.quantity);
  }

  @Delete(":cartId/items/:itemId")
  removeItem(
    @Param("cartId", new ParseUUIDPipe()) cartId: string,
    @Param("itemId", new ParseUUIDPipe()) itemId: string,
  ) {
    return this.cartService.removeItem(cartId, itemId);
  }
}

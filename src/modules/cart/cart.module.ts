import { Module } from "@nestjs/common";

import { PrismaModule } from "src/infrastructure/database/prisma/prisma.module";
import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";

import { CartService } from "./application/services/cart.service";
import { CART_REPOSITORY } from "./domain/repositories/cart.repository.token";
import { PrismaCartRepository } from "./infrastructure/persistence/prisma-cart.repository";
import { StorefrontCartController } from "./presentation/storefront/controllers/storefront-cart.controller";

@Module({
  imports: [PrismaModule],
  controllers: [StorefrontCartController],
  providers: [
    {
      provide: CART_REPOSITORY,
      useFactory: () => new PrismaCartRepository(new PrismaService()),
    },
    {
      provide: CartService,
      useFactory: (repository: PrismaCartRepository) =>
        new CartService(repository),
      inject: [CART_REPOSITORY],
    },
  ],
  exports: [CartService],
})
export class CartModule {}

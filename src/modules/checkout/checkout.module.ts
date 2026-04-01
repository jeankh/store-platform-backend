import { Module } from "@nestjs/common";

import { PrismaModule } from "src/infrastructure/database/prisma/prisma.module";
import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";

import { CheckoutService } from "./application/services/checkout.service";
import { CHECKOUT_REPOSITORY } from "./domain/repositories/checkout.repository.token";
import { PrismaCheckoutRepository } from "./infrastructure/persistence/prisma-checkout.repository";
import { StorefrontCheckoutController } from "./presentation/storefront/controllers/storefront-checkout.controller";

@Module({
  imports: [PrismaModule],
  controllers: [StorefrontCheckoutController],
  providers: [
    {
      provide: CHECKOUT_REPOSITORY,
      useFactory: () => new PrismaCheckoutRepository(new PrismaService()),
    },
    {
      provide: CheckoutService,
      useFactory: (repository: PrismaCheckoutRepository) =>
        new CheckoutService(repository),
      inject: [CHECKOUT_REPOSITORY],
    },
  ],
  exports: [CheckoutService],
})
export class CheckoutModule {}

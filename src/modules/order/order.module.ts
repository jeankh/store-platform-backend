import { Module } from "@nestjs/common";

import { AccessControlModule } from "src/modules/access-control/access-control.module";
import { CustomerModule } from "src/modules/customer/customer.module";
import { IdentityModule } from "src/modules/identity/identity.module";
import { AccessTokenGuard } from "src/modules/identity/presentation/admin/access-token.guard";
import { TokenService } from "src/modules/identity/application/services/token.service";
import { PrismaModule } from "src/infrastructure/database/prisma/prisma.module";
import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";

import { OrderService } from "./application/services/order.service";
import { ORDER_REPOSITORY } from "./domain/repositories/order.repository.token";
import { PrismaOrderRepository } from "./infrastructure/persistence/prisma-order.repository";
import { CustomerAccessTokenGuard } from "src/modules/customer/presentation/storefront/customer-access-token.guard";
import { AdminOrdersController } from "./presentation/admin/controllers/admin-orders.controller";
import { StorefrontOrdersController } from "./presentation/storefront/controllers/storefront-orders.controller";

@Module({
  imports: [PrismaModule, CustomerModule, IdentityModule, AccessControlModule],
  controllers: [StorefrontOrdersController, AdminOrdersController],
  providers: [
    {
      provide: TokenService,
      useValue: new TokenService(),
    },
    {
      provide: ORDER_REPOSITORY,
      useFactory: () => new PrismaOrderRepository(new PrismaService()),
    },
    {
      provide: OrderService,
      useFactory: (repository: PrismaOrderRepository) =>
        new OrderService(repository),
      inject: [ORDER_REPOSITORY],
    },
    {
      provide: CustomerAccessTokenGuard,
      useFactory: (tokenService: TokenService) =>
        new CustomerAccessTokenGuard(tokenService),
      inject: [TokenService],
    },
    {
      provide: AccessTokenGuard,
      useFactory: (tokenService: TokenService) =>
        new AccessTokenGuard(tokenService),
      inject: [TokenService],
    },
  ],
  exports: [OrderService],
})
export class OrderModule {}

import { Module } from "@nestjs/common";

import { AccessControlModule } from "src/modules/access-control/access-control.module";
import { CustomerModule } from "src/modules/customer/customer.module";
import { IdentityModule } from "src/modules/identity/identity.module";
import { AccessTokenGuard } from "src/modules/identity/presentation/admin/access-token.guard";
import { TokenService } from "src/modules/identity/application/services/token.service";
import { PrismaModule } from "src/infrastructure/database/prisma/prisma.module";
import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";

import { PaymentService } from "./application/services/payment.service";
import { PAYMENT_REPOSITORY } from "./domain/repositories/payment.repository.token";
import { PrismaPaymentRepository } from "./infrastructure/persistence/prisma-payment.repository";
import { CustomerAccessTokenGuard } from "src/modules/customer/presentation/storefront/customer-access-token.guard";
import { AdminPaymentsController } from "./presentation/admin/controllers/admin-payments.controller";
import { StorefrontPaymentsController } from "./presentation/storefront/controllers/storefront-payments.controller";

@Module({
  imports: [PrismaModule, CustomerModule, IdentityModule, AccessControlModule],
  controllers: [StorefrontPaymentsController, AdminPaymentsController],
  providers: [
    {
      provide: TokenService,
      useValue: new TokenService(),
    },
    {
      provide: PAYMENT_REPOSITORY,
      useFactory: () => new PrismaPaymentRepository(new PrismaService()),
    },
    {
      provide: PaymentService,
      useFactory: (repository: PrismaPaymentRepository) =>
        new PaymentService(repository),
      inject: [PAYMENT_REPOSITORY],
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
  exports: [PaymentService],
})
export class PaymentModule {}

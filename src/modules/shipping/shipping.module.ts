import { Module } from "@nestjs/common";

import { AccessControlModule } from "src/modules/access-control/access-control.module";
import { AuditModule } from "src/modules/audit/audit.module";
import { AuditService } from "src/modules/audit/application/services/audit.service";
import { PrismaAuditRepository } from "src/modules/audit/infrastructure/persistence/prisma-audit.repository";
import { CustomerModule } from "src/modules/customer/customer.module";
import { CustomerAccessTokenGuard } from "src/modules/customer/presentation/storefront/customer-access-token.guard";
import { IdentityModule } from "src/modules/identity/identity.module";
import { TokenService } from "src/modules/identity/application/services/token.service";
import { PrismaModule } from "src/infrastructure/database/prisma/prisma.module";
import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";

import { ShippingService } from "./application/services/shipping.service";
import { SHIPPING_REPOSITORY } from "./domain/repositories/shipping.repository.token";
import { PrismaShippingRepository } from "./infrastructure/persistence/prisma-shipping.repository";
import { AdminShippingController } from "./presentation/admin/controllers/admin-shipping.controller";
import { StorefrontShippingController } from "./presentation/storefront/controllers/storefront-shipping.controller";

@Module({
  imports: [
    PrismaModule,
    AuditModule,
    AccessControlModule,
    IdentityModule,
    CustomerModule,
  ],
  controllers: [AdminShippingController, StorefrontShippingController],
  providers: [
    {
      provide: TokenService,
      useValue: new TokenService(),
    },
    {
      provide: SHIPPING_REPOSITORY,
      useFactory: () => new PrismaShippingRepository(new PrismaService()),
    },
    {
      provide: ShippingService,
      useFactory: (repository: PrismaShippingRepository) =>
        new ShippingService(
          repository,
          new AuditService(new PrismaAuditRepository(new PrismaService())),
        ),
      inject: [SHIPPING_REPOSITORY],
    },
    {
      provide: CustomerAccessTokenGuard,
      useFactory: (tokenService: TokenService) =>
        new CustomerAccessTokenGuard(tokenService),
      inject: [TokenService],
    },
  ],
  exports: [ShippingService],
})
export class ShippingModule {}

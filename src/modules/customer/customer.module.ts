import { Module } from "@nestjs/common";

import { PrismaModule } from "src/infrastructure/database/prisma/prisma.module";
import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";
import { IdentityModule } from "src/modules/identity/identity.module";

import { CustomerAuthService } from "./application/services/customer-auth.service";
import { CustomerAddressService } from "./application/services/customer-address.service";
import { AdminCustomerService } from "./application/services/admin-customer.service";
import { CustomerProfileService } from "./application/services/customer-profile.service";
import { CUSTOMER_AUTH_REPOSITORY } from "./domain/repositories/customer-auth.repository.token";
import { PrismaCustomerAuthRepository } from "./infrastructure/persistence/prisma-customer-auth.repository";
import { AccessControlModule } from "src/modules/access-control/access-control.module";
import { CustomerAccessTokenGuard } from "./presentation/storefront/customer-access-token.guard";
import { AdminCustomersController } from "./presentation/admin/controllers/admin-customers.controller";
import { StorefrontAuthController } from "./presentation/storefront/controllers/storefront-auth.controller";
import { StorefrontCustomerAddressesController } from "./presentation/storefront/controllers/storefront-customer-addresses.controller";
import { StorefrontCustomersController } from "./presentation/storefront/controllers/storefront-customers.controller";
import { PasswordService } from "src/modules/identity/application/services/password.service";
import { TokenService } from "src/modules/identity/application/services/token.service";

@Module({
  imports: [PrismaModule, IdentityModule, AccessControlModule],
  controllers: [
    StorefrontAuthController,
    StorefrontCustomersController,
    StorefrontCustomerAddressesController,
    AdminCustomersController,
  ],
  providers: [
    {
      provide: PasswordService,
      useValue: new PasswordService(),
    },
    {
      provide: TokenService,
      useValue: new TokenService(),
    },
    {
      provide: CUSTOMER_AUTH_REPOSITORY,
      useFactory: () => new PrismaCustomerAuthRepository(new PrismaService()),
    },
    {
      provide: CustomerAuthService,
      useFactory: (
        repository: PrismaCustomerAuthRepository,
        passwordService: PasswordService,
        tokenService: TokenService,
      ) => new CustomerAuthService(repository, passwordService, tokenService),
      inject: [CUSTOMER_AUTH_REPOSITORY, PasswordService, TokenService],
    },
    {
      provide: CustomerProfileService,
      useFactory: (repository: PrismaCustomerAuthRepository) =>
        new CustomerProfileService(repository),
      inject: [CUSTOMER_AUTH_REPOSITORY],
    },
    {
      provide: CustomerAddressService,
      useFactory: (repository: PrismaCustomerAuthRepository) =>
        new CustomerAddressService(repository),
      inject: [CUSTOMER_AUTH_REPOSITORY],
    },
    {
      provide: AdminCustomerService,
      useFactory: (repository: PrismaCustomerAuthRepository) =>
        new AdminCustomerService(repository),
      inject: [CUSTOMER_AUTH_REPOSITORY],
    },
    {
      provide: CustomerAccessTokenGuard,
      useFactory: (tokenService: TokenService) =>
        new CustomerAccessTokenGuard(tokenService),
      inject: [TokenService],
    },
  ],
  exports: [
    CustomerAuthService,
    CustomerProfileService,
    CustomerAddressService,
    AdminCustomerService,
  ],
})
export class CustomerModule {}

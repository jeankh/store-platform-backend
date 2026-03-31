import { Module } from "@nestjs/common";

import { PrismaModule } from "src/infrastructure/database/prisma/prisma.module";
import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";

import { AuthService } from "./application/services/auth.service";
import { PasswordService } from "./application/services/password.service";
import { TokenService } from "./application/services/token.service";
import { IDENTITY_AUTH_REPOSITORY } from "./domain/repositories/identity-auth.repository.token";
import { PrismaIdentityAuthRepository } from "./infrastructure/persistence/prisma-identity-auth.repository";
import { AccessTokenGuard } from "./presentation/admin/access-token.guard";
import { AdminAuthController } from "./presentation/admin/controllers/admin-auth.controller";

@Module({
  imports: [PrismaModule],
  controllers: [AdminAuthController],
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
      provide: IDENTITY_AUTH_REPOSITORY,
      useFactory: () => new PrismaIdentityAuthRepository(new PrismaService()),
    },
    {
      provide: AuthService,
      useFactory: (
        repository: PrismaIdentityAuthRepository,
        passwordService: PasswordService,
        tokenService: TokenService,
      ) => new AuthService(repository, passwordService, tokenService),
      inject: [IDENTITY_AUTH_REPOSITORY, PasswordService, TokenService],
    },
    {
      provide: AccessTokenGuard,
      useFactory: (tokenService: TokenService) =>
        new AccessTokenGuard(tokenService),
      inject: [TokenService],
    },
  ],
  exports: [PasswordService, TokenService, AuthService],
})
export class IdentityModule {}

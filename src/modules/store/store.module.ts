import { Module } from "@nestjs/common";

import { AccessControlModule } from "src/modules/access-control/access-control.module";
import { AuditModule } from "src/modules/audit/audit.module";
import { AuditService } from "src/modules/audit/application/services/audit.service";
import { PrismaAuditRepository } from "src/modules/audit/infrastructure/persistence/prisma-audit.repository";
import { IdentityModule } from "src/modules/identity/identity.module";
import { PrismaModule } from "src/infrastructure/database/prisma/prisma.module";
import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";
import { TenantService } from "src/modules/tenant/application/services/tenant.service";
import { PrismaTenantRepository } from "src/modules/tenant/infrastructure/persistence/prisma-tenant.repository";
import { TenantModule } from "src/modules/tenant/tenant.module";

import { StoreService } from "./application/services/store.service";
import { STORE_REPOSITORY } from "./domain/repositories/store.repository.token";
import { PrismaStoreRepository } from "./infrastructure/persistence/prisma-store.repository";
import { AdminStoreController } from "./presentation/admin/controllers/admin-store.controller";

@Module({
  imports: [
    PrismaModule,
    TenantModule,
    AuditModule,
    AccessControlModule,
    IdentityModule,
  ],
  controllers: [AdminStoreController],
  providers: [
    {
      provide: STORE_REPOSITORY,
      useFactory: () => new PrismaStoreRepository(new PrismaService()),
    },
    {
      provide: StoreService,
      useFactory: (repository: PrismaStoreRepository) =>
        new StoreService(
          repository,
          new TenantService(
            new PrismaTenantRepository(new PrismaService()),
            new AuditService(new PrismaAuditRepository(new PrismaService())),
          ),
          new AuditService(new PrismaAuditRepository(new PrismaService())),
        ),
      inject: [STORE_REPOSITORY],
    },
  ],
  exports: [StoreService],
})
export class StoreModule {}

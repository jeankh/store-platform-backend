import { Module } from "@nestjs/common";

import { AccessControlModule } from "src/modules/access-control/access-control.module";
import { AuditModule } from "src/modules/audit/audit.module";
import { AuditService } from "src/modules/audit/application/services/audit.service";
import { PrismaAuditRepository } from "src/modules/audit/infrastructure/persistence/prisma-audit.repository";
import { IdentityModule } from "src/modules/identity/identity.module";
import { PrismaModule } from "src/infrastructure/database/prisma/prisma.module";
import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";

import { TenantService } from "./application/services/tenant.service";
import { TENANT_REPOSITORY } from "./domain/repositories/tenant.repository.token";
import { PrismaTenantRepository } from "./infrastructure/persistence/prisma-tenant.repository";
import { AdminTenantController } from "./presentation/admin/controllers/admin-tenant.controller";

@Module({
  imports: [PrismaModule, AuditModule, AccessControlModule, IdentityModule],
  controllers: [AdminTenantController],
  providers: [
    {
      provide: TENANT_REPOSITORY,
      useFactory: () => new PrismaTenantRepository(new PrismaService()),
    },
    {
      provide: TenantService,
      useFactory: (repository: PrismaTenantRepository) =>
        new TenantService(
          repository,
          new AuditService(new PrismaAuditRepository(new PrismaService())),
        ),
      inject: [TENANT_REPOSITORY],
    },
  ],
  exports: [TenantService],
})
export class TenantModule {}

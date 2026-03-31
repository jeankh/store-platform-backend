import { Module } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { PrismaModule } from "src/infrastructure/database/prisma/prisma.module";
import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";
import { AuditModule } from "src/modules/audit/audit.module";
import { AuditService } from "src/modules/audit/application/services/audit.service";
import { PrismaAuditRepository } from "src/modules/audit/infrastructure/persistence/prisma-audit.repository";
import { IdentityModule } from "src/modules/identity/identity.module";
import { AdminAuditController } from "src/modules/audit/presentation/admin/controllers/admin-audit.controller";

import { AccessControlService } from "./application/services/access-control.service";
import { ACCESS_CONTROL_REPOSITORY } from "./domain/repositories/access-control.repository.token";
import { PrismaAccessControlRepository } from "./infrastructure/persistence/prisma-access-control.repository";
import { AdminAccessControlController } from "./presentation/admin/controllers/admin-access-control.controller";
import { PermissionGuard } from "./presentation/admin/permission.guard";

@Module({
  imports: [PrismaModule, AuditModule, IdentityModule],
  controllers: [AdminAccessControlController, AdminAuditController],
  providers: [
    {
      provide: ACCESS_CONTROL_REPOSITORY,
      useFactory: () => new PrismaAccessControlRepository(new PrismaService()),
    },
    {
      provide: AccessControlService,
      useFactory: (repository: PrismaAccessControlRepository) =>
        new AccessControlService(
          repository,
          new AuditService(new PrismaAuditRepository(new PrismaService())),
        ),
      inject: [ACCESS_CONTROL_REPOSITORY],
    },
    {
      provide: PermissionGuard,
      useFactory: (accessControlService: AccessControlService) =>
        new PermissionGuard(accessControlService),
      inject: [AccessControlService],
    },
  ],
  exports: [AccessControlService, PermissionGuard],
})
export class AccessControlModule {}

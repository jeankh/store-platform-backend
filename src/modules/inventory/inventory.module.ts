import { Module } from "@nestjs/common";

import { AccessControlModule } from "src/modules/access-control/access-control.module";
import { AuditModule } from "src/modules/audit/audit.module";
import { AuditService } from "src/modules/audit/application/services/audit.service";
import { PrismaAuditRepository } from "src/modules/audit/infrastructure/persistence/prisma-audit.repository";
import { IdentityModule } from "src/modules/identity/identity.module";
import { PrismaModule } from "src/infrastructure/database/prisma/prisma.module";
import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";

import { InventoryService } from "./application/services/inventory.service";
import { INVENTORY_REPOSITORY } from "./domain/repositories/inventory.repository.token";
import { PrismaInventoryRepository } from "./infrastructure/persistence/prisma-inventory.repository";
import { AdminInventoryController } from "./presentation/admin/controllers/admin-inventory.controller";

@Module({
  imports: [PrismaModule, AuditModule, AccessControlModule, IdentityModule],
  controllers: [AdminInventoryController],
  providers: [
    {
      provide: INVENTORY_REPOSITORY,
      useFactory: () => new PrismaInventoryRepository(new PrismaService()),
    },
    {
      provide: InventoryService,
      useFactory: (repository: PrismaInventoryRepository) =>
        new InventoryService(
          repository,
          new AuditService(new PrismaAuditRepository(new PrismaService())),
        ),
      inject: [INVENTORY_REPOSITORY],
    },
  ],
  exports: [InventoryService],
})
export class InventoryModule {}

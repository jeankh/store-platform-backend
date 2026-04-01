import { Module } from "@nestjs/common";

import { AccessControlModule } from "src/modules/access-control/access-control.module";
import { AuditModule } from "src/modules/audit/audit.module";
import { AuditService } from "src/modules/audit/application/services/audit.service";
import { PrismaAuditRepository } from "src/modules/audit/infrastructure/persistence/prisma-audit.repository";
import { IdentityModule } from "src/modules/identity/identity.module";
import { PrismaModule } from "src/infrastructure/database/prisma/prisma.module";
import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";

import { PromotionService } from "./application/services/promotion.service";
import { PROMOTION_REPOSITORY } from "./domain/repositories/promotion.repository.token";
import { PrismaPromotionRepository } from "./infrastructure/persistence/prisma-promotion.repository";
import { AdminCouponsController } from "./presentation/admin/controllers/admin-coupons.controller";

@Module({
  imports: [PrismaModule, AuditModule, AccessControlModule, IdentityModule],
  controllers: [AdminCouponsController],
  providers: [
    {
      provide: PROMOTION_REPOSITORY,
      useFactory: () => new PrismaPromotionRepository(new PrismaService()),
    },
    {
      provide: PromotionService,
      useFactory: (repository: PrismaPromotionRepository) =>
        new PromotionService(
          repository,
          new AuditService(new PrismaAuditRepository(new PrismaService())),
        ),
      inject: [PROMOTION_REPOSITORY],
    },
  ],
  exports: [PromotionService],
})
export class PromotionModule {}

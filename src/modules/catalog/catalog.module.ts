import { Module } from "@nestjs/common";

import { AccessControlModule } from "src/modules/access-control/access-control.module";
import { AuditModule } from "src/modules/audit/audit.module";
import { AuditService } from "src/modules/audit/application/services/audit.service";
import { PrismaAuditRepository } from "src/modules/audit/infrastructure/persistence/prisma-audit.repository";
import { IdentityModule } from "src/modules/identity/identity.module";
import { PrismaModule } from "src/infrastructure/database/prisma/prisma.module";
import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";

import { CatalogService } from "./application/services/catalog.service";
import { CATALOG_REPOSITORY } from "./domain/repositories/catalog.repository.token";
import { PrismaCatalogRepository } from "./infrastructure/persistence/prisma-catalog.repository";
import { AdminCatalogProductsController } from "./presentation/admin/controllers/admin-catalog-products.controller";
import { AdminCatalogTaxonomyController } from "./presentation/admin/controllers/admin-catalog-taxonomy.controller";
import { StorefrontCatalogController } from "./presentation/storefront/controllers/storefront-catalog.controller";

@Module({
  imports: [PrismaModule, AuditModule, AccessControlModule, IdentityModule],
  controllers: [
    AdminCatalogProductsController,
    AdminCatalogTaxonomyController,
    StorefrontCatalogController,
  ],
  providers: [
    {
      provide: CATALOG_REPOSITORY,
      useFactory: () => new PrismaCatalogRepository(new PrismaService()),
    },
    {
      provide: CatalogService,
      useFactory: (repository: PrismaCatalogRepository) =>
        new CatalogService(
          repository,
          new AuditService(new PrismaAuditRepository(new PrismaService())),
        ),
      inject: [CATALOG_REPOSITORY],
    },
  ],
  exports: [CatalogService],
})
export class CatalogModule {}

import { Module } from "@nestjs/common";

import { AccessControlModule } from "src/modules/access-control/access-control.module";
import { IdentityModule } from "src/modules/identity/identity.module";
import { PrismaModule } from "src/infrastructure/database/prisma/prisma.module";
import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";

import { SearchService } from "./application/services/search.service";
import { SEARCH_REPOSITORY } from "./domain/repositories/search.repository.token";
import { PrismaSearchRepository } from "./infrastructure/persistence/prisma-search.repository";
import { AdminSearchController } from "./presentation/admin/controllers/admin-search.controller";
import { StorefrontSearchController } from "./presentation/storefront/controllers/storefront-search.controller";

@Module({
  imports: [PrismaModule, IdentityModule, AccessControlModule],
  controllers: [StorefrontSearchController, AdminSearchController],
  providers: [
    {
      provide: SEARCH_REPOSITORY,
      useFactory: () => new PrismaSearchRepository(new PrismaService()),
    },
    {
      provide: SearchService,
      useFactory: (repository: PrismaSearchRepository) =>
        new SearchService(repository),
      inject: [SEARCH_REPOSITORY],
    },
  ],
  exports: [SearchService],
})
export class SearchModule {}

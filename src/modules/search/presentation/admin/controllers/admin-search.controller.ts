import { Controller, Get, Inject, Post, UseGuards } from "@nestjs/common";

import { PermissionGuard } from "src/modules/access-control/presentation/admin/permission.guard";
import { RequirePermission } from "src/modules/access-control/presentation/admin/require-permission.decorator";
import { AccessTokenGuard } from "src/modules/identity/presentation/admin/access-token.guard";

import { SearchService } from "../../../application/services/search.service";

@Controller("admin/search")
@UseGuards(AccessTokenGuard, PermissionGuard)
export class AdminSearchController {
  constructor(
    @Inject(SearchService) private readonly searchService: SearchService,
  ) {}

  @Post("reindex/products")
  @RequirePermission("search.update")
  reindexProducts() {
    return this.searchService.reindexProducts();
  }

  @Get("index-status")
  @RequirePermission("search.read")
  getIndexStatus() {
    return this.searchService.getIndexStatus();
  }
}

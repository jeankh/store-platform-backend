import { Body, Controller, Get, Inject, Post, UseGuards } from "@nestjs/common";

import { PermissionGuard } from "src/modules/access-control/presentation/admin/permission.guard";
import { RequirePermission } from "src/modules/access-control/presentation/admin/require-permission.decorator";
import { AccessTokenGuard } from "src/modules/identity/presentation/admin/access-token.guard";
import { AuthUser } from "src/modules/identity/presentation/admin/auth-user.decorator";
import { AuthenticatedUser } from "src/modules/identity/presentation/admin/authenticated-user.interface";

import { CatalogService } from "../../../application/services/catalog.service";
import { CreateCategoryDto } from "../dto/create-category.dto";
import { CreateCollectionDto } from "../dto/create-collection.dto";

@Controller("admin")
@UseGuards(AccessTokenGuard, PermissionGuard)
export class AdminCatalogTaxonomyController {
  constructor(
    @Inject(CatalogService) private readonly catalogService: CatalogService,
  ) {}

  @Post("categories")
  @RequirePermission("category.update")
  createCategory(
    @AuthUser() user: AuthenticatedUser,
    @Body() body: CreateCategoryDto,
  ) {
    return this.catalogService.createCategory(user.userId, user.tenantId, body);
  }

  @Get("categories")
  @RequirePermission("category.read")
  listCategories(@AuthUser() user: AuthenticatedUser) {
    return this.catalogService.listCategories(user.tenantId);
  }

  @Post("collections")
  @RequirePermission("collection.update")
  createCollection(
    @AuthUser() user: AuthenticatedUser,
    @Body() body: CreateCollectionDto,
  ) {
    return this.catalogService.createCollection(
      user.userId,
      user.tenantId,
      body,
    );
  }

  @Get("collections")
  @RequirePermission("collection.read")
  listCollections(@AuthUser() user: AuthenticatedUser) {
    return this.catalogService.listCollections(user.tenantId);
  }
}

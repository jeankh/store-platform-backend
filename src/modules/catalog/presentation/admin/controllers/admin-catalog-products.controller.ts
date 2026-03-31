import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";

import { PermissionGuard } from "src/modules/access-control/presentation/admin/permission.guard";
import { RequirePermission } from "src/modules/access-control/presentation/admin/require-permission.decorator";
import { AccessTokenGuard } from "src/modules/identity/presentation/admin/access-token.guard";
import { AuthUser } from "src/modules/identity/presentation/admin/auth-user.decorator";
import { AuthenticatedUser } from "src/modules/identity/presentation/admin/authenticated-user.interface";

import { CatalogService } from "../../../application/services/catalog.service";
import { CreateProductVariantDto } from "../dto/create-product-variant.dto";
import { CreateProductDto } from "../dto/create-product.dto";
import { UpdateProductDto } from "../dto/update-product.dto";

@Controller("admin/products")
@UseGuards(AccessTokenGuard, PermissionGuard)
export class AdminCatalogProductsController {
  constructor(
    @Inject(CatalogService) private readonly catalogService: CatalogService,
  ) {}

  @Post()
  @RequirePermission("catalog.create")
  createProduct(
    @AuthUser() user: AuthenticatedUser,
    @Body() body: CreateProductDto,
  ) {
    return this.catalogService.createProduct(user.userId, user.tenantId, body);
  }

  @Get()
  @RequirePermission("catalog.read")
  listProducts(@AuthUser() user: AuthenticatedUser) {
    return this.catalogService.listProducts(user.tenantId);
  }

  @Get(":productId")
  @RequirePermission("catalog.read")
  getProduct(
    @AuthUser() user: AuthenticatedUser,
    @Param("productId", new ParseUUIDPipe()) productId: string,
  ) {
    return this.catalogService.getProduct(user.tenantId, productId);
  }

  @Patch(":productId")
  @RequirePermission("catalog.update")
  updateProduct(
    @AuthUser() user: AuthenticatedUser,
    @Param("productId", new ParseUUIDPipe()) productId: string,
    @Body() body: UpdateProductDto,
  ) {
    return this.catalogService.updateProduct(
      user.userId,
      user.tenantId,
      productId,
      body,
    );
  }

  @Post(":productId/variants")
  @RequirePermission("catalog.update")
  createVariant(
    @AuthUser() user: AuthenticatedUser,
    @Param("productId", new ParseUUIDPipe()) productId: string,
    @Body() body: CreateProductVariantDto,
  ) {
    return this.catalogService.createVariant(
      user.userId,
      user.tenantId,
      productId,
      body,
    );
  }
}

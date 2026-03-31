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

import { StoreService } from "../../../application/services/store.service";
import { CreateStoreDto } from "../dto/create-store.dto";
import { UpdateStoreDto } from "../dto/update-store.dto";

@Controller("admin")
@UseGuards(AccessTokenGuard, PermissionGuard)
export class AdminStoreController {
  constructor(
    @Inject(StoreService) private readonly storeService: StoreService,
  ) {}

  @Post("tenants/:tenantId/stores")
  @RequirePermission("store.create")
  create(
    @AuthUser() user: AuthenticatedUser,
    @Param("tenantId", new ParseUUIDPipe()) tenantId: string,
    @Body() body: CreateStoreDto,
  ) {
    return this.storeService.create(user.userId, user.tenantId, tenantId, body);
  }

  @Get("tenants/:tenantId/stores")
  @RequirePermission("store.read")
  listByTenant(
    @AuthUser() user: AuthenticatedUser,
    @Param("tenantId", new ParseUUIDPipe()) tenantId: string,
  ) {
    return this.storeService.listByTenant(user.tenantId, tenantId);
  }

  @Get("stores/:storeId")
  @RequirePermission("store.read")
  getById(
    @AuthUser() user: AuthenticatedUser,
    @Param("storeId", new ParseUUIDPipe()) storeId: string,
  ) {
    return this.storeService.getById(user.tenantId, storeId);
  }

  @Patch("stores/:storeId")
  @RequirePermission("store.update")
  update(
    @AuthUser() user: AuthenticatedUser,
    @Param("storeId", new ParseUUIDPipe()) storeId: string,
    @Body() body: UpdateStoreDto,
  ) {
    return this.storeService.update(user.userId, user.tenantId, storeId, body);
  }
}

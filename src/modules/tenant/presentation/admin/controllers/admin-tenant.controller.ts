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

import { TenantService } from "../../../application/services/tenant.service";
import { CreateTenantDto } from "../dto/create-tenant.dto";
import { UpdateTenantDto } from "../dto/update-tenant.dto";

@Controller("admin/tenants")
export class AdminTenantController {
  constructor(
    @Inject(TenantService) private readonly tenantService: TenantService,
  ) {}

  @Post()
  create(@Body() body: CreateTenantDto) {
    return this.tenantService.create(null, body);
  }

  @Get()
  @UseGuards(AccessTokenGuard, PermissionGuard)
  @RequirePermission("tenant.read")
  list() {
    return this.tenantService.list();
  }

  @Get(":tenantId")
  @UseGuards(AccessTokenGuard, PermissionGuard)
  @RequirePermission("tenant.read")
  getById(@Param("tenantId", new ParseUUIDPipe()) tenantId: string) {
    return this.tenantService.getById(tenantId);
  }

  @Patch(":tenantId")
  @UseGuards(AccessTokenGuard, PermissionGuard)
  @RequirePermission("tenant.update")
  update(
    @AuthUser() user: AuthenticatedUser,
    @Param("tenantId", new ParseUUIDPipe()) tenantId: string,
    @Body() body: UpdateTenantDto,
  ) {
    return this.tenantService.update(
      user.userId,
      user.tenantId,
      tenantId,
      body,
    );
  }
}

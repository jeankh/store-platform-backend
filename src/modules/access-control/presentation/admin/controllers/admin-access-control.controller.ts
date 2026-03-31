import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";

import { AccessTokenGuard } from "src/modules/identity/presentation/admin/access-token.guard";
import { AuthUser } from "src/modules/identity/presentation/admin/auth-user.decorator";
import { AuthenticatedUser } from "src/modules/identity/presentation/admin/authenticated-user.interface";

import { AccessControlService } from "../../../application/services/access-control.service";
import { AssignRoleDto } from "../dto/assign-role.dto";
import { CreateRoleDto } from "../dto/create-role.dto";
import { PermissionGuard } from "../permission.guard";
import { RequirePermission } from "../require-permission.decorator";

@Controller("admin")
@UseGuards(AccessTokenGuard, PermissionGuard)
export class AdminAccessControlController {
  constructor(
    @Inject(AccessControlService)
    private readonly accessControlService: AccessControlService,
  ) {}

  @Get("permissions")
  @RequirePermission("role.read")
  permissions() {
    return this.accessControlService.listPermissions();
  }

  @Post("roles")
  @RequirePermission("role.create")
  createRole(@AuthUser() user: AuthenticatedUser, @Body() body: CreateRoleDto) {
    return this.accessControlService.createRole(user.userId, {
      tenantId: user.tenantId,
      name: body.name,
      code: body.code,
      permissionCodes: body.permissionCodes,
    });
  }

  @Get("roles")
  @RequirePermission("role.read")
  listRoles(@AuthUser() user: AuthenticatedUser) {
    return this.accessControlService.listRoles(user.tenantId);
  }

  @Post("users/:userId/roles")
  @RequirePermission("user.assign_role")
  async assignRole(
    @AuthUser() user: AuthenticatedUser,
    @Param("userId") userId: string,
    @Body() body: AssignRoleDto,
  ) {
    await this.accessControlService.assignRole(user.userId, {
      tenantId: user.tenantId,
      userId,
      roleId: body.roleId,
    });
  }
}

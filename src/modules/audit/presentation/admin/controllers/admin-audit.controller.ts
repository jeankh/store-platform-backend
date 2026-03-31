import { Controller, Get, Inject, Query, UseGuards } from "@nestjs/common";

import { PermissionGuard } from "src/modules/access-control/presentation/admin/permission.guard";
import { RequirePermission } from "src/modules/access-control/presentation/admin/require-permission.decorator";
import { AccessTokenGuard } from "src/modules/identity/presentation/admin/access-token.guard";
import { AuthUser } from "src/modules/identity/presentation/admin/auth-user.decorator";
import { AuthenticatedUser } from "src/modules/identity/presentation/admin/authenticated-user.interface";

import { AuditService } from "../../../application/services/audit.service";

@Controller("admin/audit-logs")
@UseGuards(AccessTokenGuard, PermissionGuard)
export class AdminAuditController {
  constructor(
    @Inject(AuditService) private readonly auditService: AuditService,
  ) {}

  @Get()
  @RequirePermission("audit.read")
  list(
    @AuthUser() user: AuthenticatedUser,
    @Query("actorUserId") actorUserId?: string,
    @Query("action") action?: string,
  ) {
    return this.auditService.list({
      tenantId: user.tenantId,
      actorUserId,
      action,
    });
  }
}

import {
  Inject,
  Injectable,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";

import { AuditService } from "src/modules/audit/application/services/audit.service";

import {
  PermissionRecord,
  RoleRecord,
} from "../../domain/entities/access-control-records";
import {
  AccessControlRepository,
  CreateRoleInput,
} from "../../domain/repositories/access-control.repository";
import { ACCESS_CONTROL_REPOSITORY } from "../../domain/repositories/access-control.repository.token";

@Injectable()
export class AccessControlService {
  constructor(
    @Inject(ACCESS_CONTROL_REPOSITORY)
    private readonly repository: AccessControlRepository,
    @Inject(AuditService)
    private readonly auditService: AuditService,
  ) {}

  async seedSystemPermissions() {
    await this.repository.seedSystemPermissions();
  }

  listPermissions(): Promise<PermissionRecord[]> {
    return this.repository.listPermissions();
  }

  async createRole(
    actorUserId: string,
    input: CreateRoleInput,
  ): Promise<RoleRecord> {
    const role = await this.repository.createRole(input);

    await this.auditService.record({
      tenantId: input.tenantId,
      actorUserId,
      action: "role.created",
      entityType: "role",
      entityId: role.id,
      metadata: { code: role.code },
    });

    return role;
  }

  listRoles(tenantId: string): Promise<RoleRecord[]> {
    return this.repository.listRoles(tenantId);
  }

  async assignRole(
    actorUserId: string,
    input: { tenantId: string; userId: string; roleId: string },
  ) {
    const roles = await this.repository.listRoles(input.tenantId);
    const role = roles.find((entry) => entry.id === input.roleId);

    if (!role) {
      throw new NotFoundException("Role not found");
    }

    await this.repository.assignRole(input);

    await this.auditService.record({
      tenantId: input.tenantId,
      actorUserId,
      action: "role.assigned",
      entityType: "user_role",
      entityId: `${input.userId}:${input.roleId}`,
      metadata: { userId: input.userId, roleId: input.roleId },
    });
  }

  async ensurePermission(userId: string, permissionCode: string) {
    const permissionCodes =
      await this.repository.getUserPermissionCodes(userId);

    if (!permissionCodes.includes(permissionCode)) {
      throw new ForbiddenException(`Missing permission '${permissionCode}'`);
    }
  }
}

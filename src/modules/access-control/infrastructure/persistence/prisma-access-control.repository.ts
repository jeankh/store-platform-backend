import { Injectable } from "@nestjs/common";

import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";

import { SYSTEM_PERMISSIONS } from "../../domain/constants/system-permissions";
import {
  PermissionRecord,
  RoleRecord,
} from "../../domain/entities/access-control-records";
import {
  AccessControlRepository,
  AssignRoleInput,
  CreateRoleInput,
} from "../../domain/repositories/access-control.repository";

@Injectable()
export class PrismaAccessControlRepository implements AccessControlRepository {
  constructor(private readonly prisma: PrismaService) {}

  async seedSystemPermissions(): Promise<void> {
    for (const permission of SYSTEM_PERMISSIONS) {
      await this.prisma.permission.upsert({
        where: { code: permission.code },
        update: {
          name: permission.name,
          resource: permission.resource,
          action: permission.action,
        },
        create: permission,
      });
    }
  }

  async listPermissions(): Promise<PermissionRecord[]> {
    const permissions = await this.prisma.permission.findMany({
      orderBy: { code: "asc" },
    });

    return permissions.map((permission) => ({
      id: permission.id,
      code: permission.code,
      name: permission.name,
      resource: permission.resource,
      action: permission.action,
    }));
  }

  async createRole(input: CreateRoleInput): Promise<RoleRecord> {
    const permissions = await this.prisma.permission.findMany({
      where: {
        code: { in: input.permissionCodes },
      },
    });

    const role = await this.prisma.role.create({
      data: {
        tenantId: input.tenantId,
        name: input.name,
        code: input.code,
        isSystem: input.isSystem || false,
        rolePermissions: {
          createMany: {
            data: permissions.map((permission) => ({
              permissionId: permission.id,
            })),
          },
        },
      },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    return {
      id: role.id,
      tenantId: role.tenantId,
      name: role.name,
      code: role.code,
      isSystem: role.isSystem,
      permissionCodes: role.rolePermissions.map(
        (entry) => entry.permission.code,
      ),
    };
  }

  async listRoles(tenantId: string): Promise<RoleRecord[]> {
    const roles = await this.prisma.role.findMany({
      where: { tenantId },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
      orderBy: { code: "asc" },
    });

    return roles.map((role) => ({
      id: role.id,
      tenantId: role.tenantId,
      name: role.name,
      code: role.code,
      isSystem: role.isSystem,
      permissionCodes: role.rolePermissions.map(
        (entry) => entry.permission.code,
      ),
    }));
  }

  async assignRole(input: AssignRoleInput): Promise<void> {
    await this.prisma.userRole.create({
      data: {
        userId: input.userId,
        roleId: input.roleId,
      },
    });
  }

  async getUserPermissionCodes(userId: string): Promise<string[]> {
    const roles = await this.prisma.userRole.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    return [
      ...new Set(
        roles.flatMap((entry) =>
          entry.role.rolePermissions.map((rp) => rp.permission.code),
        ),
      ),
    ];
  }
}

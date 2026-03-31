import {
  PermissionRecord,
  RoleRecord,
} from "../entities/access-control-records";

export type CreateRoleInput = {
  tenantId: string;
  name: string;
  code: string;
  permissionCodes: string[];
  isSystem?: boolean;
};

export type AssignRoleInput = {
  userId: string;
  roleId: string;
  tenantId: string;
};

export interface AccessControlRepository {
  seedSystemPermissions(): Promise<void>;
  listPermissions(): Promise<PermissionRecord[]>;
  createRole(input: CreateRoleInput): Promise<RoleRecord>;
  listRoles(tenantId: string): Promise<RoleRecord[]>;
  assignRole(input: AssignRoleInput): Promise<void>;
  getUserPermissionCodes(userId: string): Promise<string[]>;
}

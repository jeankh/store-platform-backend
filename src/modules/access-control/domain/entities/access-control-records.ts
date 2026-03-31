export type PermissionRecord = {
  id: string;
  code: string;
  name: string;
  resource: string;
  action: string;
};

export type RoleRecord = {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  isSystem: boolean;
  permissionCodes: string[];
};

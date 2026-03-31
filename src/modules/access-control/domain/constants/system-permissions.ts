export type PermissionDefinition = {
  code: string;
  name: string;
  resource: string;
  action: string;
};

export const SYSTEM_PERMISSIONS: PermissionDefinition[] = [
  {
    code: "tenant.create",
    name: "Create tenant",
    resource: "tenant",
    action: "create",
  },
  {
    code: "tenant.read",
    name: "Read tenant",
    resource: "tenant",
    action: "read",
  },
  {
    code: "tenant.update",
    name: "Update tenant",
    resource: "tenant",
    action: "update",
  },
  {
    code: "store.create",
    name: "Create store",
    resource: "store",
    action: "create",
  },
  { code: "store.read", name: "Read store", resource: "store", action: "read" },
  {
    code: "store.update",
    name: "Update store",
    resource: "store",
    action: "update",
  },
  {
    code: "role.create",
    name: "Create role",
    resource: "role",
    action: "create",
  },
  { code: "role.read", name: "Read role", resource: "role", action: "read" },
  {
    code: "user.assign_role",
    name: "Assign user role",
    resource: "user",
    action: "assign_role",
  },
  {
    code: "audit.read",
    name: "Read audit logs",
    resource: "audit",
    action: "read",
  },
];

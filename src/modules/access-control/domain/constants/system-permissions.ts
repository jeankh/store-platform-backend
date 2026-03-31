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
    code: "store.settings.read",
    name: "Read store settings",
    resource: "store.settings",
    action: "read",
  },
  {
    code: "store.settings.update",
    name: "Update store settings",
    resource: "store.settings",
    action: "update",
  },
  {
    code: "store.locale.read",
    name: "Read store locales",
    resource: "store.locale",
    action: "read",
  },
  {
    code: "store.locale.update",
    name: "Update store locales",
    resource: "store.locale",
    action: "update",
  },
  {
    code: "store.currency.read",
    name: "Read store currencies",
    resource: "store.currency",
    action: "read",
  },
  {
    code: "store.currency.update",
    name: "Update store currencies",
    resource: "store.currency",
    action: "update",
  },
  {
    code: "store.tax.read",
    name: "Read store tax config",
    resource: "store.tax",
    action: "read",
  },
  {
    code: "store.tax.update",
    name: "Update store tax config",
    resource: "store.tax",
    action: "update",
  },
  {
    code: "customer.read",
    name: "Read customer",
    resource: "customer",
    action: "read",
  },
  {
    code: "customer.update",
    name: "Update customer",
    resource: "customer",
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

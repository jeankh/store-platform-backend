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
    code: "catalog.read",
    name: "Read catalog",
    resource: "catalog",
    action: "read",
  },
  {
    code: "catalog.create",
    name: "Create catalog items",
    resource: "catalog",
    action: "create",
  },
  {
    code: "catalog.update",
    name: "Update catalog items",
    resource: "catalog",
    action: "update",
  },
  {
    code: "catalog.publish",
    name: "Publish catalog items",
    resource: "catalog",
    action: "publish",
  },
  {
    code: "category.read",
    name: "Read category",
    resource: "category",
    action: "read",
  },
  {
    code: "category.update",
    name: "Update category",
    resource: "category",
    action: "update",
  },
  {
    code: "collection.read",
    name: "Read collection",
    resource: "collection",
    action: "read",
  },
  {
    code: "collection.update",
    name: "Update collection",
    resource: "collection",
    action: "update",
  },
  {
    code: "pricing.read",
    name: "Read pricing",
    resource: "pricing",
    action: "read",
  },
  {
    code: "pricing.update",
    name: "Update pricing",
    resource: "pricing",
    action: "update",
  },
  {
    code: "promotion.read",
    name: "Read promotions",
    resource: "promotion",
    action: "read",
  },
  {
    code: "promotion.update",
    name: "Update promotions",
    resource: "promotion",
    action: "update",
  },
  {
    code: "warehouse.read",
    name: "Read warehouses",
    resource: "warehouse",
    action: "read",
  },
  {
    code: "warehouse.update",
    name: "Update warehouses",
    resource: "warehouse",
    action: "update",
  },
  {
    code: "inventory.read",
    name: "Read inventory",
    resource: "inventory",
    action: "read",
  },
  {
    code: "inventory.update",
    name: "Update inventory",
    resource: "inventory",
    action: "update",
  },
  {
    code: "search.read",
    name: "Read search",
    resource: "search",
    action: "read",
  },
  {
    code: "search.update",
    name: "Update search",
    resource: "search",
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

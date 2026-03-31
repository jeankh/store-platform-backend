export type StoreView = {
  id: string;
  tenantId: string;
  slug: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
  defaultLocale: string;
  defaultCurrency: string;
};

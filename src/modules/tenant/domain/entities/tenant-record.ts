export type TenantView = {
  id: string;
  slug: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
  defaultLocale: string;
  defaultCurrency: string;
};

export type StoreView = {
  id: string;
  tenantId: string;
  slug: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
  defaultLocale: string;
  defaultCurrency: string;
};

export type StoreSettingsView = {
  storeId: string;
  defaultLocale: string;
  defaultCurrency: string;
  displayName: string | null;
  supportEmail: string | null;
  supportPhone: string | null;
  timezone: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
};

export type StoreLocaleView = {
  storeId: string;
  localeCode: string;
  isDefault: boolean;
};

export type StoreCurrencyView = {
  storeId: string;
  currencyCode: string;
  isDefault: boolean;
};

export type StoreTaxConfigView = {
  storeId: string;
  countryCode: string;
  regionCode: string | null;
  taxInclusive: boolean;
  taxProvider: string | null;
  taxCalculationStrategy: string | null;
};

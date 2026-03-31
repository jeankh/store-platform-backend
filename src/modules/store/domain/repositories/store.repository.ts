import {
  StoreCurrencyView,
  StoreLocaleView,
  StoreSettingsView,
  StoreTaxConfigView,
  StoreView,
} from "../entities/store-record";

export type CreateStoreInput = {
  tenantId: string;
  slug: string;
  name: string;
  defaultLocale: string;
  defaultCurrency: string;
};

export type UpdateStoreInput = {
  storeId: string;
  slug?: string;
  name?: string;
  status?: "ACTIVE" | "INACTIVE";
  defaultLocale?: string;
  defaultCurrency?: string;
};

export type UpdateStoreSettingsInput = {
  storeId: string;
  displayName?: string | null;
  supportEmail?: string | null;
  supportPhone?: string | null;
  timezone?: string | null;
  logoUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
};

export type AddStoreLocaleInput = {
  storeId: string;
  localeCode: string;
  isDefault?: boolean;
};

export type AddStoreCurrencyInput = {
  storeId: string;
  currencyCode: string;
  isDefault?: boolean;
};

export type UpsertStoreTaxConfigInput = {
  storeId: string;
  countryCode: string;
  regionCode?: string | null;
  taxInclusive: boolean;
  taxProvider?: string | null;
  taxCalculationStrategy?: string | null;
};

export interface StoreRepository {
  create(input: CreateStoreInput): Promise<StoreView>;
  listByTenant(tenantId: string): Promise<StoreView[]>;
  findById(storeId: string): Promise<StoreView | null>;
  findByTenantAndSlug(
    tenantId: string,
    slug: string,
  ): Promise<StoreView | null>;
  update(input: UpdateStoreInput): Promise<StoreView>;
  getSettings(storeId: string): Promise<StoreSettingsView | null>;
  updateSettings(input: UpdateStoreSettingsInput): Promise<StoreSettingsView>;
  listLocales(storeId: string): Promise<StoreLocaleView[]>;
  addLocale(input: AddStoreLocaleInput): Promise<StoreLocaleView>;
  removeLocale(storeId: string, localeCode: string): Promise<void>;
  listCurrencies(storeId: string): Promise<StoreCurrencyView[]>;
  addCurrency(input: AddStoreCurrencyInput): Promise<StoreCurrencyView>;
  removeCurrency(storeId: string, currencyCode: string): Promise<void>;
  getTaxConfig(storeId: string): Promise<StoreTaxConfigView | null>;
  upsertTaxConfig(
    input: UpsertStoreTaxConfigInput,
  ): Promise<StoreTaxConfigView>;
}

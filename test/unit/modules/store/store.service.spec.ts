import { describe, expect, it } from "vitest";

import { AuditService } from "src/modules/audit/application/services/audit.service";
import { StoreService } from "src/modules/store/application/services/store.service";
import {
  StoreCurrencyView,
  StoreLocaleView,
  StoreSettingsView,
  StoreTaxConfigView,
  StoreView,
} from "src/modules/store/domain/entities/store-record";
import { StoreRepository } from "src/modules/store/domain/repositories/store.repository";
import { TenantService } from "src/modules/tenant/application/services/tenant.service";

class InMemoryStoreRepository implements StoreRepository {
  stores = new Map<string, StoreView>();
  settings = new Map<string, StoreSettingsView>();
  locales = new Map<string, StoreLocaleView[]>();
  currencies = new Map<string, StoreCurrencyView[]>();
  taxConfigs = new Map<string, StoreTaxConfigView>();

  async create(input: {
    tenantId: string;
    slug: string;
    name: string;
    defaultLocale: string;
    defaultCurrency: string;
  }) {
    const store: StoreView = {
      id: `store-${this.stores.size + 1}`,
      tenantId: input.tenantId,
      slug: input.slug,
      name: input.name,
      status: "ACTIVE",
      defaultLocale: input.defaultLocale,
      defaultCurrency: input.defaultCurrency,
    };
    this.stores.set(store.id, store);
    this.settings.set(store.id, {
      storeId: store.id,
      defaultLocale: store.defaultLocale,
      defaultCurrency: store.defaultCurrency,
      displayName: null,
      supportEmail: null,
      supportPhone: null,
      timezone: null,
      logoUrl: null,
      primaryColor: null,
      secondaryColor: null,
    });
    this.locales.set(store.id, []);
    this.currencies.set(store.id, []);
    return store;
  }

  async listByTenant(tenantId: string) {
    return Array.from(this.stores.values()).filter(
      (store) => store.tenantId === tenantId,
    );
  }

  async findById(storeId: string) {
    return this.stores.get(storeId) || null;
  }

  async findByTenantAndSlug(tenantId: string, slug: string) {
    return (
      Array.from(this.stores.values()).find(
        (store) => store.tenantId === tenantId && store.slug === slug,
      ) || null
    );
  }

  async update(input: {
    storeId: string;
    slug?: string;
    name?: string;
    status?: "ACTIVE" | "INACTIVE";
    defaultLocale?: string;
    defaultCurrency?: string;
  }) {
    const store = this.stores.get(input.storeId)!;
    const nextStore: StoreView = {
      ...store,
      slug: input.slug || store.slug,
      name: input.name || store.name,
      status: input.status || store.status,
      defaultLocale: input.defaultLocale || store.defaultLocale,
      defaultCurrency: input.defaultCurrency || store.defaultCurrency,
    };
    this.stores.set(input.storeId, nextStore);
    return nextStore;
  }

  async getSettings(storeId: string) {
    return this.settings.get(storeId) || null;
  }

  async updateSettings(input: {
    storeId: string;
    displayName?: string | null;
    supportEmail?: string | null;
    supportPhone?: string | null;
    timezone?: string | null;
    logoUrl?: string | null;
    primaryColor?: string | null;
    secondaryColor?: string | null;
  }) {
    const settings = this.settings.get(input.storeId)!;
    const nextSettings: StoreSettingsView = {
      ...settings,
      displayName:
        input.displayName !== undefined
          ? input.displayName
          : settings.displayName,
      supportEmail:
        input.supportEmail !== undefined
          ? input.supportEmail
          : settings.supportEmail,
      supportPhone:
        input.supportPhone !== undefined
          ? input.supportPhone
          : settings.supportPhone,
      timezone:
        input.timezone !== undefined ? input.timezone : settings.timezone,
      logoUrl: input.logoUrl !== undefined ? input.logoUrl : settings.logoUrl,
      primaryColor:
        input.primaryColor !== undefined
          ? input.primaryColor
          : settings.primaryColor,
      secondaryColor:
        input.secondaryColor !== undefined
          ? input.secondaryColor
          : settings.secondaryColor,
    };
    this.settings.set(input.storeId, nextSettings);
    return nextSettings;
  }

  async listLocales(storeId: string) {
    return this.locales.get(storeId) || [];
  }

  async addLocale(input: {
    storeId: string;
    localeCode: string;
    isDefault?: boolean;
  }) {
    const locale = {
      storeId: input.storeId,
      localeCode: input.localeCode,
      isDefault: Boolean(input.isDefault),
    };
    const locales = this.locales.get(input.storeId) || [];
    this.locales.set(input.storeId, [...locales, locale]);
    return locale;
  }

  async removeLocale(storeId: string, localeCode: string) {
    const locales = this.locales.get(storeId) || [];
    this.locales.set(
      storeId,
      locales.filter((locale) => locale.localeCode !== localeCode),
    );
  }

  async listCurrencies(storeId: string) {
    return this.currencies.get(storeId) || [];
  }

  async addCurrency(input: {
    storeId: string;
    currencyCode: string;
    isDefault?: boolean;
  }) {
    const currency = {
      storeId: input.storeId,
      currencyCode: input.currencyCode,
      isDefault: Boolean(input.isDefault),
    };
    const currencies = this.currencies.get(input.storeId) || [];
    this.currencies.set(input.storeId, [...currencies, currency]);
    return currency;
  }

  async removeCurrency(storeId: string, currencyCode: string) {
    const currencies = this.currencies.get(storeId) || [];
    this.currencies.set(
      storeId,
      currencies.filter((currency) => currency.currencyCode !== currencyCode),
    );
  }

  async getTaxConfig(storeId: string) {
    return this.taxConfigs.get(storeId) || null;
  }

  async upsertTaxConfig(input: {
    storeId: string;
    countryCode: string;
    taxInclusive: boolean;
    regionCode?: string | null;
    taxProvider?: string | null;
    taxCalculationStrategy?: string | null;
  }) {
    const config = {
      storeId: input.storeId,
      countryCode: input.countryCode,
      regionCode: input.regionCode || null,
      taxInclusive: input.taxInclusive,
      taxProvider: input.taxProvider || null,
      taxCalculationStrategy: input.taxCalculationStrategy || null,
    };
    this.taxConfigs.set(input.storeId, config);
    return config;
  }
}

class TenantServiceStub {
  async getById(tenantId: string) {
    if (tenantId === "missing-tenant") {
      throw new Error("Tenant not found");
    }

    return { id: tenantId };
  }
}

class AuditServiceStub {
  async record() {
    return;
  }
}

describe("Store module unit tests", () => {
  it("creates a store under a valid tenant", async () => {
    const service = new StoreService(
      new InMemoryStoreRepository(),
      new TenantServiceStub() as unknown as TenantService,
      new AuditServiceStub() as unknown as AuditService,
    );
    const store = await service.create("user-1", "tenant-1", "tenant-1", {
      slug: "Main Store",
      name: "Main Store",
    });

    expect(store.slug).toBe("main-store");
  });

  it("rejects store creation when tenant does not exist", async () => {
    const service = new StoreService(
      new InMemoryStoreRepository(),
      new TenantServiceStub() as unknown as TenantService,
      new AuditServiceStub() as unknown as AuditService,
    );

    await expect(
      service.create("user-1", "missing-tenant", "missing-tenant", {
        slug: "Main Store",
        name: "Main Store",
      }),
    ).rejects.toThrow("Tenant not found");
  });

  it("rejects duplicate store slug within the same tenant", async () => {
    const repository = new InMemoryStoreRepository();
    const service = new StoreService(
      repository,
      new TenantServiceStub() as unknown as TenantService,
      new AuditServiceStub() as unknown as AuditService,
    );
    await service.create("user-1", "tenant-1", "tenant-1", {
      slug: "Main Store",
      name: "Main Store",
    });

    await expect(
      service.create("user-1", "tenant-1", "tenant-1", {
        slug: "Main Store",
        name: "Main Store 2",
      }),
    ).rejects.toThrow("Store slug already exists for tenant");
  });

  it("allows the same store slug under different tenants", async () => {
    const repository = new InMemoryStoreRepository();
    const service = new StoreService(
      repository,
      new TenantServiceStub() as unknown as TenantService,
      new AuditServiceStub() as unknown as AuditService,
    );
    const first = await service.create("user-1", "tenant-1", "tenant-1", {
      slug: "Main Store",
      name: "Main Store",
    });
    const second = await service.create("user-2", "tenant-2", "tenant-2", {
      slug: "Main Store",
      name: "Main Store",
    });

    expect(first.slug).toBe(second.slug);
    expect(first.tenantId).not.toBe(second.tenantId);
  });

  it("updates store metadata and settings", async () => {
    const repository = new InMemoryStoreRepository();
    const service = new StoreService(
      repository,
      new TenantServiceStub() as unknown as TenantService,
      new AuditServiceStub() as unknown as AuditService,
    );
    const store = await service.create("user-1", "tenant-1", "tenant-1", {
      slug: "Main Store",
      name: "Main Store",
    });
    const updated = await service.update("user-1", "tenant-1", store.id, {
      name: "Main Store 2",
      defaultCurrency: "EUR",
    });

    expect(updated.name).toBe("Main Store 2");
    expect(updated.defaultCurrency).toBe("EUR");
  });

  it("rejects reading or mutating a store outside its tenant scope", async () => {
    const repository = new InMemoryStoreRepository();
    const service = new StoreService(
      repository,
      new TenantServiceStub() as unknown as TenantService,
      new AuditServiceStub() as unknown as AuditService,
    );
    const store = await service.create("user-1", "tenant-1", "tenant-1", {
      slug: "Main Store",
      name: "Main Store",
    });

    await expect(service.getById("tenant-2", store.id)).rejects.toThrow(
      "Cross-tenant access is not allowed",
    );
  });
});

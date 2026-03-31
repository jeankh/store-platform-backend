import { describe, expect, it } from "vitest";

import { AuditService } from "src/modules/audit/application/services/audit.service";
import { StoreService } from "src/modules/store/application/services/store.service";
import {
  StoreCurrencyView,
  StoreSettingsView,
  StoreView,
} from "src/modules/store/domain/entities/store-record";
import { StoreRepository } from "src/modules/store/domain/repositories/store.repository";
import { TenantService } from "src/modules/tenant/application/services/tenant.service";

class InMemoryStoreRepository implements StoreRepository {
  stores = new Map<string, StoreView>();
  settings = new Map<string, StoreSettingsView>();
  currencies = new Map<string, StoreCurrencyView[]>();
  async create(input: any) {
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
    this.currencies.set(store.id, []);
    return store;
  }
  async listByTenant() {
    return [];
  }
  async findById(storeId: string) {
    return this.stores.get(storeId) || null;
  }
  async findByTenantAndSlug() {
    return null;
  }
  async update(input: any) {
    return this.stores.get(input.storeId)!;
  }
  async getSettings(storeId: string) {
    return this.settings.get(storeId) || null;
  }
  async updateSettings(input: any) {
    return this.settings.get(input.storeId)!;
  }
  async listLocales() {
    return [];
  }
  async addLocale() {
    return { storeId: "", localeCode: "", isDefault: false };
  }
  async removeLocale() {
    return;
  }
  async listCurrencies(storeId: string) {
    return this.currencies.get(storeId) || [];
  }
  async addCurrency(input: {
    storeId: string;
    currencyCode: string;
    isDefault?: boolean;
  }) {
    const list = this.currencies.get(input.storeId) || [];
    const shouldBeDefault = input.isDefault || list.length === 0;
    const next = list.map((currency) => ({
      ...currency,
      isDefault: shouldBeDefault ? false : currency.isDefault,
    }));
    const currency = {
      storeId: input.storeId,
      currencyCode: input.currencyCode,
      isDefault: shouldBeDefault,
    };
    next.push(currency);
    this.currencies.set(input.storeId, next);
    const settings = this.settings.get(input.storeId)!;
    if (shouldBeDefault) settings.defaultCurrency = input.currencyCode;
    return currency;
  }
  async removeCurrency(storeId: string, currencyCode: string) {
    const list = this.currencies.get(storeId) || [];
    this.currencies.set(
      storeId,
      list.filter((currency) => currency.currencyCode !== currencyCode),
    );
  }
  async getTaxConfig() {
    return null;
  }
  async upsertTaxConfig() {
    return {
      storeId: "",
      countryCode: "",
      regionCode: null,
      taxInclusive: false,
      taxProvider: null,
      taxCalculationStrategy: null,
    };
  }
}

class TenantServiceStub {
  async getById(tenantId: string) {
    return { id: tenantId };
  }
}
class AuditServiceStub {
  async record() {
    return;
  }
}

describe("Store currencies unit tests", () => {
  it("adds a currency to a store", async () => {
    const repository = new InMemoryStoreRepository();
    const service = new StoreService(
      repository,
      new TenantServiceStub() as any,
      new AuditServiceStub() as any,
    );
    const store = await repository.create({
      tenantId: "tenant-1",
      slug: "main-store",
      name: "Main",
      defaultLocale: "en",
      defaultCurrency: "USD",
    });
    const currency = await service.addCurrency("user-1", "tenant-1", store.id, {
      currencyCode: "EUR",
    });
    expect(currency.currencyCode).toBe("EUR");
  });

  it("rejects duplicate currency for the same store", async () => {
    const repository = new InMemoryStoreRepository();
    const service = new StoreService(
      repository,
      new TenantServiceStub() as any,
      new AuditServiceStub() as any,
    );
    const store = await repository.create({
      tenantId: "tenant-1",
      slug: "main-store",
      name: "Main",
      defaultLocale: "en",
      defaultCurrency: "USD",
    });
    await service.addCurrency("user-1", "tenant-1", store.id, {
      currencyCode: "EUR",
    });
    await expect(
      service.addCurrency("user-1", "tenant-1", store.id, {
        currencyCode: "EUR",
      }),
    ).rejects.toThrow("Store currency already exists");
  });

  it("sets exactly one default currency at a time", async () => {
    const repository = new InMemoryStoreRepository();
    const service = new StoreService(
      repository,
      new TenantServiceStub() as any,
      new AuditServiceStub() as any,
    );
    const store = await repository.create({
      tenantId: "tenant-1",
      slug: "main-store",
      name: "Main",
      defaultLocale: "en",
      defaultCurrency: "USD",
    });
    await service.addCurrency("user-1", "tenant-1", store.id, {
      currencyCode: "USD",
    });
    await service.addCurrency("user-1", "tenant-1", store.id, {
      currencyCode: "EUR",
      isDefault: true,
    });
    const currencies = await service.listCurrencies("tenant-1", store.id);
    expect(currencies.filter((currency) => currency.isDefault)).toHaveLength(1);
    expect(
      currencies.find((currency) => currency.isDefault)?.currencyCode,
    ).toBe("EUR");
  });

  it("rejects removing the current default currency unless another default is assigned first", async () => {
    const repository = new InMemoryStoreRepository();
    const service = new StoreService(
      repository,
      new TenantServiceStub() as any,
      new AuditServiceStub() as any,
    );
    const store = await repository.create({
      tenantId: "tenant-1",
      slug: "main-store",
      name: "Main",
      defaultLocale: "en",
      defaultCurrency: "USD",
    });
    await service.addCurrency("user-1", "tenant-1", store.id, {
      currencyCode: "USD",
    });
    await expect(
      service.removeCurrency("user-1", "tenant-1", store.id, "USD"),
    ).rejects.toThrow(
      "Cannot remove the default currency without assigning a replacement",
    );
  });
});

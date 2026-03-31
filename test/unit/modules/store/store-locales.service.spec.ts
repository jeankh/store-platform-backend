import { describe, expect, it } from "vitest";

import { AuditService } from "src/modules/audit/application/services/audit.service";
import { StoreService } from "src/modules/store/application/services/store.service";
import {
  StoreLocaleView,
  StoreSettingsView,
  StoreView,
} from "src/modules/store/domain/entities/store-record";
import { StoreRepository } from "src/modules/store/domain/repositories/store.repository";
import { TenantService } from "src/modules/tenant/application/services/tenant.service";

class InMemoryStoreRepository implements StoreRepository {
  stores = new Map<string, StoreView>();
  settings = new Map<string, StoreSettingsView>();
  locales = new Map<string, StoreLocaleView[]>();

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
    this.locales.set(store.id, []);
    return store;
  }
  async listByTenant(tenantId: string) {
    return Array.from(this.stores.values()).filter(
      (s) => s.tenantId === tenantId,
    );
  }
  async findById(storeId: string) {
    return this.stores.get(storeId) || null;
  }
  async findByTenantAndSlug(tenantId: string, slug: string) {
    return (
      Array.from(this.stores.values()).find(
        (s) => s.tenantId === tenantId && s.slug === slug,
      ) || null
    );
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
  async listLocales(storeId: string) {
    return this.locales.get(storeId) || [];
  }
  async addLocale(input: {
    storeId: string;
    localeCode: string;
    isDefault?: boolean;
  }) {
    const list = this.locales.get(input.storeId) || [];
    const shouldBeDefault = input.isDefault || list.length === 0;
    const next = list.map((locale) => ({
      ...locale,
      isDefault: shouldBeDefault ? false : locale.isDefault,
    }));
    const locale = {
      storeId: input.storeId,
      localeCode: input.localeCode,
      isDefault: shouldBeDefault,
    };
    next.push(locale);
    this.locales.set(input.storeId, next);
    const settings = this.settings.get(input.storeId)!;
    if (shouldBeDefault) settings.defaultLocale = input.localeCode;
    return locale;
  }
  async removeLocale(storeId: string, localeCode: string) {
    const list = this.locales.get(storeId) || [];
    this.locales.set(
      storeId,
      list.filter((locale) => locale.localeCode !== localeCode),
    );
  }
  async listCurrencies() {
    return [];
  }
  async addCurrency() {
    return { storeId: "", currencyCode: "", isDefault: false };
  }
  async removeCurrency() {
    return;
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

describe("Store locales unit tests", () => {
  it("adds a locale to a store", async () => {
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
    const locale = await service.addLocale("user-1", "tenant-1", store.id, {
      localeCode: "fr-FR",
    });
    expect(locale.localeCode).toBe("fr-FR");
  });

  it("rejects duplicate locale for the same store", async () => {
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
    await service.addLocale("user-1", "tenant-1", store.id, {
      localeCode: "fr-FR",
    });
    await expect(
      service.addLocale("user-1", "tenant-1", store.id, {
        localeCode: "fr-FR",
      }),
    ).rejects.toThrow("Store locale already exists");
  });

  it("allows multiple locales for one store", async () => {
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
    await service.addLocale("user-1", "tenant-1", store.id, {
      localeCode: "en",
    });
    await service.addLocale("user-1", "tenant-1", store.id, {
      localeCode: "fr-FR",
    });
    expect((await service.listLocales("tenant-1", store.id)).length).toBe(2);
  });

  it("sets exactly one default locale at a time", async () => {
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
    await service.addLocale("user-1", "tenant-1", store.id, {
      localeCode: "en",
    });
    await service.addLocale("user-1", "tenant-1", store.id, {
      localeCode: "fr-FR",
      isDefault: true,
    });
    const locales = await service.listLocales("tenant-1", store.id);
    expect(locales.filter((locale) => locale.isDefault)).toHaveLength(1);
    expect(locales.find((locale) => locale.isDefault)?.localeCode).toBe(
      "fr-FR",
    );
  });

  it("rejects removing the current default locale unless a replacement is assigned first", async () => {
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
    await service.addLocale("user-1", "tenant-1", store.id, {
      localeCode: "en",
    });
    await expect(
      service.removeLocale("user-1", "tenant-1", store.id, "en"),
    ).rejects.toThrow(
      "Cannot remove the default locale without assigning a replacement",
    );
  });
});

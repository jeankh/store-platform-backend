import { describe, expect, it } from "vitest";

import { AuditService } from "src/modules/audit/application/services/audit.service";
import { StoreService } from "src/modules/store/application/services/store.service";
import {
  StoreSettingsView,
  StoreTaxConfigView,
  StoreView,
} from "src/modules/store/domain/entities/store-record";
import { StoreRepository } from "src/modules/store/domain/repositories/store.repository";
import { TenantService } from "src/modules/tenant/application/services/tenant.service";

class InMemoryStoreRepository implements StoreRepository {
  stores = new Map<string, StoreView>();
  settings = new Map<string, StoreSettingsView>();
  taxConfigs = new Map<string, StoreTaxConfigView>();
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
  async listCurrencies() {
    return [];
  }
  async addCurrency() {
    return { storeId: "", currencyCode: "", isDefault: false };
  }
  async removeCurrency() {
    return;
  }
  async getTaxConfig(storeId: string) {
    return this.taxConfigs.get(storeId) || null;
  }
  async upsertTaxConfig(input: any) {
    const taxConfig: StoreTaxConfigView = {
      storeId: input.storeId,
      countryCode: input.countryCode,
      regionCode: input.regionCode || null,
      taxInclusive: input.taxInclusive,
      taxProvider: input.taxProvider || null,
      taxCalculationStrategy: input.taxCalculationStrategy || null,
    };
    this.taxConfigs.set(input.storeId, taxConfig);
    return taxConfig;
  }
}

class TenantServiceStub {
  async getById(tenantId: string) {
    if (tenantId === "missing-tenant") throw new Error("Tenant not found");
    return { id: tenantId };
  }
}
class AuditServiceStub {
  async record() {
    return;
  }
}

describe("Store tax config unit tests", () => {
  it("creates or updates tax configuration for a store", async () => {
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
    const taxConfig = await service.upsertTaxConfig(
      "user-1",
      "tenant-1",
      store.id,
      { countryCode: "FR", taxInclusive: true },
    );
    expect(taxConfig.countryCode).toBe("FR");
  });

  it("stores tax inclusive or exclusive mode correctly", async () => {
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
    const taxConfig = await service.upsertTaxConfig(
      "user-1",
      "tenant-1",
      store.id,
      { countryCode: "FR", taxInclusive: false },
    );
    expect(taxConfig.taxInclusive).toBe(false);
  });

  it("rejects tax updates outside actor tenant scope", async () => {
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
    await expect(
      service.upsertTaxConfig("user-1", "tenant-2", store.id, {
        countryCode: "FR",
        taxInclusive: true,
      }),
    ).rejects.toThrow("Cross-tenant access is not allowed");
  });
});

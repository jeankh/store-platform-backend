import { describe, expect, it } from "vitest";

import { AuditService } from "src/modules/audit/application/services/audit.service";
import { StoreService } from "src/modules/store/application/services/store.service";
import {
  StoreSettingsView,
  StoreView,
} from "src/modules/store/domain/entities/store-record";
import { StoreRepository } from "src/modules/store/domain/repositories/store.repository";
import { TenantService } from "src/modules/tenant/application/services/tenant.service";

class InMemoryStoreRepository implements StoreRepository {
  stores = new Map<string, StoreView>();
  settings = new Map<string, StoreSettingsView>();

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

  async update(input: any) {
    const store = this.stores.get(input.storeId)!;
    const nextStore = {
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

  async updateSettings(input: any) {
    const settings = this.settings.get(input.storeId)!;
    const nextSettings = {
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
}

class TenantServiceStub {
  async getById(tenantId: string) {
    return { id: tenantId };
  }
}

class AuditServiceStub {
  records: unknown[] = [];

  async record(input: unknown) {
    this.records.push(input);
    return input;
  }
}

describe("Store settings unit tests", () => {
  it("reads store settings for a store in the actor tenant scope", async () => {
    const repository = new InMemoryStoreRepository();
    const auditService = new AuditServiceStub();
    const service = new StoreService(
      repository,
      new TenantServiceStub() as unknown as TenantService,
      auditService as unknown as AuditService,
    );
    const store = await repository.create({
      tenantId: "tenant-1",
      slug: "main-store",
      name: "Main Store",
      defaultLocale: "en",
      defaultCurrency: "USD",
    });

    const settings = await service.getSettings("tenant-1", store.id);

    expect(settings.storeId).toBe(store.id);
    expect(settings.defaultLocale).toBe("en");
  });

  it("updates display name, support email, support phone, and timezone", async () => {
    const repository = new InMemoryStoreRepository();
    const auditService = new AuditServiceStub();
    const service = new StoreService(
      repository,
      new TenantServiceStub() as unknown as TenantService,
      auditService as unknown as AuditService,
    );
    const store = await repository.create({
      tenantId: "tenant-1",
      slug: "main-store",
      name: "Main Store",
      defaultLocale: "en",
      defaultCurrency: "USD",
    });

    const settings = await service.updateSettings(
      "user-1",
      "tenant-1",
      store.id,
      {
        displayName: "Main Store Display",
        supportEmail: "support@store.com",
        supportPhone: "+123456",
        timezone: "Europe/Paris",
      },
    );

    expect(settings.displayName).toBe("Main Store Display");
    expect(settings.supportEmail).toBe("support@store.com");
    expect(settings.supportPhone).toBe("+123456");
    expect(settings.timezone).toBe("Europe/Paris");
  });

  it("updates branding fields like logo URL and color values", async () => {
    const repository = new InMemoryStoreRepository();
    const auditService = new AuditServiceStub();
    const service = new StoreService(
      repository,
      new TenantServiceStub() as unknown as TenantService,
      auditService as unknown as AuditService,
    );
    const store = await repository.create({
      tenantId: "tenant-1",
      slug: "main-store",
      name: "Main Store",
      defaultLocale: "en",
      defaultCurrency: "USD",
    });

    const settings = await service.updateSettings(
      "user-1",
      "tenant-1",
      store.id,
      {
        logoUrl: "https://cdn.test/logo.png",
        primaryColor: "#112233",
        secondaryColor: "#ffffff",
      },
    );

    expect(settings.logoUrl).toBe("https://cdn.test/logo.png");
    expect(settings.primaryColor).toBe("#112233");
    expect(settings.secondaryColor).toBe("#ffffff");
  });

  it("rejects access to store settings outside the actor tenant scope", async () => {
    const repository = new InMemoryStoreRepository();
    const service = new StoreService(
      repository,
      new TenantServiceStub() as unknown as TenantService,
      new AuditServiceStub() as unknown as AuditService,
    );
    const store = await repository.create({
      tenantId: "tenant-1",
      slug: "main-store",
      name: "Main Store",
      defaultLocale: "en",
      defaultCurrency: "USD",
    });

    await expect(service.getSettings("tenant-2", store.id)).rejects.toThrow(
      "Cross-tenant access is not allowed",
    );
  });
});

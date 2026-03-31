import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { AuditService } from "src/modules/audit/application/services/audit.service";
import { TenantService } from "src/modules/tenant/application/services/tenant.service";

import {
  StoreCurrencyView,
  StoreLocaleView,
  StoreSettingsView,
  StoreTaxConfigView,
  StoreView,
} from "../../domain/entities/store-record";
import { StoreRepository } from "../../domain/repositories/store.repository";
import { STORE_REPOSITORY } from "../../domain/repositories/store.repository.token";

@Injectable()
export class StoreService {
  constructor(
    @Inject(STORE_REPOSITORY) private readonly repository: StoreRepository,
    @Inject(TenantService)
    private readonly tenantService: TenantService,
    @Inject(AuditService)
    private readonly auditService: AuditService,
  ) {}

  async create(
    actorUserId: string,
    actorTenantId: string,
    tenantId: string,
    input: {
      slug: string;
      name: string;
      defaultLocale?: string;
      defaultCurrency?: string;
    },
  ): Promise<StoreView> {
    this.ensureTenantAccess(actorTenantId, tenantId);
    await this.tenantService.getById(tenantId);

    const normalizedSlug = this.normalizeSlug(input.slug);
    const existingStore = await this.repository.findByTenantAndSlug(
      tenantId,
      normalizedSlug,
    );

    if (existingStore) {
      throw new ConflictException("Store slug already exists for tenant");
    }

    const store = await this.repository.create({
      tenantId,
      slug: normalizedSlug,
      name: input.name,
      defaultLocale: input.defaultLocale || "en",
      defaultCurrency: input.defaultCurrency || "USD",
    });

    await this.auditService.record({
      tenantId,
      actorUserId,
      action: "store.created",
      entityType: "store",
      entityId: store.id,
      metadata: { slug: store.slug },
    });

    return store;
  }

  listByTenant(actorTenantId: string, tenantId: string) {
    this.ensureTenantAccess(actorTenantId, tenantId);
    return this.repository.listByTenant(tenantId);
  }

  async getById(actorTenantId: string, storeId: string) {
    const store = await this.repository.findById(storeId);

    if (!store) {
      throw new NotFoundException("Store not found");
    }

    this.ensureTenantAccess(actorTenantId, store.tenantId);

    return store;
  }

  async update(
    actorUserId: string,
    actorTenantId: string,
    storeId: string,
    input: {
      slug?: string;
      name?: string;
      status?: "ACTIVE" | "INACTIVE";
      defaultLocale?: string;
      defaultCurrency?: string;
    },
  ) {
    const currentStore = await this.getById(actorTenantId, storeId);

    if (input.slug) {
      const normalizedSlug = this.normalizeSlug(input.slug);
      const existingStore = await this.repository.findByTenantAndSlug(
        currentStore.tenantId,
        normalizedSlug,
      );

      if (existingStore && existingStore.id !== storeId) {
        throw new ConflictException("Store slug already exists for tenant");
      }

      input.slug = normalizedSlug;
    }

    const store = await this.repository.update({ storeId, ...input });

    await this.auditService.record({
      tenantId: store.tenantId,
      actorUserId,
      action: "store.updated",
      entityType: "store",
      entityId: store.id,
      metadata: { status: store.status },
    });

    return store;
  }

  async getSettings(
    actorTenantId: string,
    storeId: string,
  ): Promise<StoreSettingsView> {
    const store = await this.getById(actorTenantId, storeId);
    const settings = await this.repository.getSettings(store.id);

    if (!settings) {
      throw new NotFoundException("Store settings not found");
    }

    return settings;
  }

  async updateSettings(
    actorUserId: string,
    actorTenantId: string,
    storeId: string,
    input: {
      displayName?: string | null;
      supportEmail?: string | null;
      supportPhone?: string | null;
      timezone?: string | null;
      logoUrl?: string | null;
      primaryColor?: string | null;
      secondaryColor?: string | null;
    },
  ): Promise<StoreSettingsView> {
    const store = await this.getById(actorTenantId, storeId);
    const settings = await this.repository.updateSettings({
      storeId: store.id,
      ...input,
    });

    await this.auditService.record({
      tenantId: store.tenantId,
      actorUserId,
      action: "store.settings.updated",
      entityType: "store_settings",
      entityId: store.id,
      metadata: {
        changedFields: Object.keys(input).filter(
          (key) => input[key as keyof typeof input] !== undefined,
        ),
      },
    });

    return settings;
  }

  async listLocales(
    actorTenantId: string,
    storeId: string,
  ): Promise<StoreLocaleView[]> {
    const store = await this.getById(actorTenantId, storeId);
    return this.repository.listLocales(store.id);
  }

  async addLocale(
    actorUserId: string,
    actorTenantId: string,
    storeId: string,
    input: { localeCode: string; isDefault?: boolean },
  ): Promise<StoreLocaleView> {
    const store = await this.getById(actorTenantId, storeId);
    const existing = await this.repository.listLocales(store.id);
    const localeCode = input.localeCode;

    if (existing.some((locale) => locale.localeCode === localeCode)) {
      throw new ConflictException("Store locale already exists");
    }

    const locale = await this.repository.addLocale({
      storeId: store.id,
      localeCode,
      isDefault: input.isDefault,
    });

    await this.auditService.record({
      tenantId: store.tenantId,
      actorUserId,
      action: "store.locale.added",
      entityType: "store_locale",
      entityId: `${store.id}:${locale.localeCode}`,
      metadata: { localeCode: locale.localeCode, isDefault: locale.isDefault },
    });

    return locale;
  }

  async removeLocale(
    actorUserId: string,
    actorTenantId: string,
    storeId: string,
    localeCode: string,
  ): Promise<void> {
    const store = await this.getById(actorTenantId, storeId);
    const locales = await this.repository.listLocales(store.id);
    const locale = locales.find((entry) => entry.localeCode === localeCode);

    if (!locale) {
      throw new NotFoundException("Store locale not found");
    }

    if (locale.isDefault) {
      throw new ConflictException(
        "Cannot remove the default locale without assigning a replacement",
      );
    }

    await this.repository.removeLocale(store.id, localeCode);

    await this.auditService.record({
      tenantId: store.tenantId,
      actorUserId,
      action: "store.locale.removed",
      entityType: "store_locale",
      entityId: `${store.id}:${localeCode}`,
      metadata: { localeCode },
    });
  }

  async listCurrencies(
    actorTenantId: string,
    storeId: string,
  ): Promise<StoreCurrencyView[]> {
    const store = await this.getById(actorTenantId, storeId);
    return this.repository.listCurrencies(store.id);
  }

  async addCurrency(
    actorUserId: string,
    actorTenantId: string,
    storeId: string,
    input: { currencyCode: string; isDefault?: boolean },
  ): Promise<StoreCurrencyView> {
    const store = await this.getById(actorTenantId, storeId);
    const existing = await this.repository.listCurrencies(store.id);
    const currencyCode = input.currencyCode.toUpperCase();

    if (existing.some((currency) => currency.currencyCode === currencyCode)) {
      throw new ConflictException("Store currency already exists");
    }

    const currency = await this.repository.addCurrency({
      storeId: store.id,
      currencyCode,
      isDefault: input.isDefault,
    });

    await this.auditService.record({
      tenantId: store.tenantId,
      actorUserId,
      action: "store.currency.added",
      entityType: "store_currency",
      entityId: `${store.id}:${currency.currencyCode}`,
      metadata: {
        currencyCode: currency.currencyCode,
        isDefault: currency.isDefault,
      },
    });

    return currency;
  }

  async removeCurrency(
    actorUserId: string,
    actorTenantId: string,
    storeId: string,
    currencyCode: string,
  ): Promise<void> {
    const store = await this.getById(actorTenantId, storeId);
    const currencies = await this.repository.listCurrencies(store.id);
    const normalizedCode = currencyCode.toUpperCase();
    const currency = currencies.find(
      (entry) => entry.currencyCode === normalizedCode,
    );

    if (!currency) {
      throw new NotFoundException("Store currency not found");
    }

    if (currency.isDefault) {
      throw new ConflictException(
        "Cannot remove the default currency without assigning a replacement",
      );
    }

    await this.repository.removeCurrency(store.id, normalizedCode);

    await this.auditService.record({
      tenantId: store.tenantId,
      actorUserId,
      action: "store.currency.removed",
      entityType: "store_currency",
      entityId: `${store.id}:${normalizedCode}`,
      metadata: { currencyCode: normalizedCode },
    });
  }

  async getTaxConfig(
    actorTenantId: string,
    storeId: string,
  ): Promise<StoreTaxConfigView> {
    const store = await this.getById(actorTenantId, storeId);
    const taxConfig = await this.repository.getTaxConfig(store.id);

    if (!taxConfig) {
      throw new NotFoundException("Store tax config not found");
    }

    return taxConfig;
  }

  async upsertTaxConfig(
    actorUserId: string,
    actorTenantId: string,
    storeId: string,
    input: {
      countryCode: string;
      regionCode?: string | null;
      taxInclusive: boolean;
      taxProvider?: string | null;
      taxCalculationStrategy?: string | null;
    },
  ): Promise<StoreTaxConfigView> {
    const store = await this.getById(actorTenantId, storeId);
    const taxConfig = await this.repository.upsertTaxConfig({
      storeId: store.id,
      countryCode: input.countryCode,
      regionCode: input.regionCode,
      taxInclusive: input.taxInclusive,
      taxProvider: input.taxProvider,
      taxCalculationStrategy: input.taxCalculationStrategy,
    });

    await this.auditService.record({
      tenantId: store.tenantId,
      actorUserId,
      action: "store.tax.updated",
      entityType: "store_tax_config",
      entityId: store.id,
      metadata: {
        countryCode: taxConfig.countryCode,
        regionCode: taxConfig.regionCode,
        taxInclusive: taxConfig.taxInclusive,
      },
    });

    return taxConfig;
  }

  ensureTenantAccess(actorTenantId: string, targetTenantId: string) {
    if (actorTenantId !== targetTenantId) {
      throw new ForbiddenException("Cross-tenant access is not allowed");
    }
  }

  normalizeSlug(slug: string) {
    return slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
}

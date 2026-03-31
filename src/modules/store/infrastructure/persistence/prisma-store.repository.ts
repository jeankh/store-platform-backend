import { Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";

import {
  StoreCurrencyView,
  StoreLocaleView,
  StoreSettingsView,
  StoreTaxConfigView,
  StoreView,
} from "../../domain/entities/store-record";
import {
  AddStoreCurrencyInput,
  AddStoreLocaleInput,
  CreateStoreInput,
  StoreRepository,
  UpsertStoreTaxConfigInput,
  UpdateStoreInput,
  UpdateStoreSettingsInput,
} from "../../domain/repositories/store.repository";

@Injectable()
export class PrismaStoreRepository implements StoreRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateStoreInput): Promise<StoreView> {
    const store = await this.prisma.store.create({
      data: {
        tenantId: input.tenantId,
        slug: input.slug,
        name: input.name,
        settings: {
          create: {
            defaultLocale: input.defaultLocale,
            defaultCurrency: input.defaultCurrency,
          },
        },
      },
      include: { settings: true },
    });

    return this.mapStore(store);
  }

  async listByTenant(tenantId: string): Promise<StoreView[]> {
    const stores = await this.prisma.store.findMany({
      where: { tenantId },
      include: { settings: true },
      orderBy: { createdAt: "asc" },
    });

    return stores.map((store) => this.mapStore(store));
  }

  async findById(storeId: string): Promise<StoreView | null> {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      include: { settings: true },
    });
    return store ? this.mapStore(store) : null;
  }

  async findByTenantAndSlug(
    tenantId: string,
    slug: string,
  ): Promise<StoreView | null> {
    const store = await this.prisma.store.findUnique({
      where: { tenantId_slug: { tenantId, slug } },
      include: { settings: true },
    });

    return store ? this.mapStore(store) : null;
  }

  async update(input: UpdateStoreInput): Promise<StoreView> {
    const store = await this.prisma.store
      .update({
        where: { id: input.storeId },
        data: {
          slug: input.slug,
          name: input.name,
          status: input.status,
          settings: {
            update: {
              defaultLocale: input.defaultLocale,
              defaultCurrency: input.defaultCurrency,
            },
          },
        },
        include: { settings: true },
      })
      .catch(() => {
        throw new NotFoundException("Store not found");
      });

    return this.mapStore(store);
  }

  async getSettings(storeId: string): Promise<StoreSettingsView | null> {
    const settings = await this.prisma.storeSettings.findUnique({
      where: { storeId },
    });

    return settings ? this.mapSettings(settings) : null;
  }

  async updateSettings(
    input: UpdateStoreSettingsInput,
  ): Promise<StoreSettingsView> {
    const settings = await this.prisma.storeSettings
      .update({
        where: { storeId: input.storeId },
        data: {
          displayName: input.displayName,
          supportEmail: input.supportEmail,
          supportPhone: input.supportPhone,
          timezone: input.timezone,
          logoUrl: input.logoUrl,
          primaryColor: input.primaryColor,
          secondaryColor: input.secondaryColor,
        },
      })
      .catch(() => {
        throw new NotFoundException("Store settings not found");
      });

    return this.mapSettings(settings);
  }

  async listLocales(storeId: string): Promise<StoreLocaleView[]> {
    const locales = await this.prisma.storeLocale.findMany({
      where: { storeId },
      orderBy: [{ isDefault: "desc" }, { localeCode: "asc" }],
    });

    return locales.map((locale) => this.mapLocale(locale));
  }

  async addLocale(input: AddStoreLocaleInput): Promise<StoreLocaleView> {
    const locale = await this.prisma.$transaction(async (tx) => {
      const existingCount = await tx.storeLocale.count({
        where: { storeId: input.storeId },
      });
      const shouldBeDefault = input.isDefault || existingCount === 0;

      if (shouldBeDefault) {
        await tx.storeLocale.updateMany({
          where: { storeId: input.storeId },
          data: { isDefault: false },
        });
      }

      const locale = await tx.storeLocale.create({
        data: {
          storeId: input.storeId,
          localeCode: input.localeCode,
          isDefault: shouldBeDefault,
        },
      });

      if (shouldBeDefault) {
        await tx.storeSettings.update({
          where: { storeId: input.storeId },
          data: { defaultLocale: input.localeCode },
        });
      }

      return locale;
    });

    return this.mapLocale(locale);
  }

  async removeLocale(storeId: string, localeCode: string): Promise<void> {
    await this.prisma.storeLocale.delete({
      where: { storeId_localeCode: { storeId, localeCode } },
    });
  }

  async listCurrencies(storeId: string): Promise<StoreCurrencyView[]> {
    const currencies = await this.prisma.storeCurrency.findMany({
      where: { storeId },
      orderBy: [{ isDefault: "desc" }, { currencyCode: "asc" }],
    });

    return currencies.map((currency) => this.mapCurrency(currency));
  }

  async addCurrency(input: AddStoreCurrencyInput): Promise<StoreCurrencyView> {
    const currency = await this.prisma.$transaction(async (tx) => {
      const existingCount = await tx.storeCurrency.count({
        where: { storeId: input.storeId },
      });
      const shouldBeDefault = input.isDefault || existingCount === 0;

      if (shouldBeDefault) {
        await tx.storeCurrency.updateMany({
          where: { storeId: input.storeId },
          data: { isDefault: false },
        });
      }

      const currency = await tx.storeCurrency.create({
        data: {
          storeId: input.storeId,
          currencyCode: input.currencyCode,
          isDefault: shouldBeDefault,
        },
      });

      if (shouldBeDefault) {
        await tx.storeSettings.update({
          where: { storeId: input.storeId },
          data: { defaultCurrency: input.currencyCode },
        });
      }

      return currency;
    });

    return this.mapCurrency(currency);
  }

  async removeCurrency(storeId: string, currencyCode: string): Promise<void> {
    await this.prisma.storeCurrency.delete({
      where: { storeId_currencyCode: { storeId, currencyCode } },
    });
  }

  async getTaxConfig(storeId: string): Promise<StoreTaxConfigView | null> {
    const config = await this.prisma.storeTaxConfig.findUnique({
      where: { storeId },
    });
    return config ? this.mapTaxConfig(config) : null;
  }

  async upsertTaxConfig(
    input: UpsertStoreTaxConfigInput,
  ): Promise<StoreTaxConfigView> {
    const config = await this.prisma.storeTaxConfig.upsert({
      where: { storeId: input.storeId },
      update: {
        countryCode: input.countryCode,
        regionCode: input.regionCode,
        taxInclusive: input.taxInclusive,
        taxProvider: input.taxProvider,
        taxCalculationStrategy: input.taxCalculationStrategy,
      },
      create: {
        storeId: input.storeId,
        countryCode: input.countryCode,
        regionCode: input.regionCode,
        taxInclusive: input.taxInclusive,
        taxProvider: input.taxProvider,
        taxCalculationStrategy: input.taxCalculationStrategy,
      },
    });

    return this.mapTaxConfig(config);
  }

  private mapStore(store: {
    id: string;
    tenantId: string;
    slug: string;
    name: string;
    status: "ACTIVE" | "INACTIVE";
    settings: { defaultLocale: string; defaultCurrency: string } | null;
  }): StoreView {
    return {
      id: store.id,
      tenantId: store.tenantId,
      slug: store.slug,
      name: store.name,
      status: store.status,
      defaultLocale: store.settings?.defaultLocale || "en",
      defaultCurrency: store.settings?.defaultCurrency || "USD",
    };
  }

  private mapSettings(settings: {
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
  }): StoreSettingsView {
    return {
      storeId: settings.storeId,
      defaultLocale: settings.defaultLocale,
      defaultCurrency: settings.defaultCurrency,
      displayName: settings.displayName,
      supportEmail: settings.supportEmail,
      supportPhone: settings.supportPhone,
      timezone: settings.timezone,
      logoUrl: settings.logoUrl,
      primaryColor: settings.primaryColor,
      secondaryColor: settings.secondaryColor,
    };
  }

  private mapLocale(locale: {
    storeId: string;
    localeCode: string;
    isDefault: boolean;
  }): StoreLocaleView {
    return {
      storeId: locale.storeId,
      localeCode: locale.localeCode,
      isDefault: locale.isDefault,
    };
  }

  private mapCurrency(currency: {
    storeId: string;
    currencyCode: string;
    isDefault: boolean;
  }): StoreCurrencyView {
    return {
      storeId: currency.storeId,
      currencyCode: currency.currencyCode,
      isDefault: currency.isDefault,
    };
  }

  private mapTaxConfig(config: {
    storeId: string;
    countryCode: string;
    regionCode: string | null;
    taxInclusive: boolean;
    taxProvider: string | null;
    taxCalculationStrategy: string | null;
  }): StoreTaxConfigView {
    return {
      storeId: config.storeId,
      countryCode: config.countryCode,
      regionCode: config.regionCode,
      taxInclusive: config.taxInclusive,
      taxProvider: config.taxProvider,
      taxCalculationStrategy: config.taxCalculationStrategy,
    };
  }
}

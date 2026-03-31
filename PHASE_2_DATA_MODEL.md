# Phase 2 Data Model

## Purpose

- Define the exact Phase 2 data model additions before implementation.
- Extend the current platform core with store configuration, localization, currency, branding, and tax-baseline support.

## Status

- Phase 2 schema additions have been translated into `prisma/schema.prisma`.
- Prisma validation passes for the current Phase 2 schema draft.
- The Phase 2 migration has been generated and applied successfully.

## Scope

### Included Entities

- extend `store_settings`
- `store_locales`
- `store_currencies`
- `store_tax_configs`
- optional lightweight store-branding fields in `store_settings`

### Not Included Yet

- full media asset management tables for arbitrary uploads
- store domains
- CMS/page content
- pricing catalogs or currency conversion rates
- product/media relations

## Design Principles

- keep `stores` as the owning root for all Phase 2 configuration records
- keep one default locale and one default currency on `store_settings`
- use dedicated tables for enabled locales and enabled currencies
- keep tax config explicit and store-scoped instead of overloading unrelated settings
- avoid over-modeling branding/media in Phase 2; store references first, advanced media later

## Entity Changes

### store_settings

#### Purpose

- extend the existing store configuration record with branding, support, timezone, and lightweight storefront settings

#### Existing Fields

- `id`
- `store_id`
- `default_locale`
- `default_currency`
- `created_at`
- `updated_at`

#### New Fields To Add

- `display_name` - string, nullable
- `support_email` - string, nullable
- `support_phone` - string, nullable
- `timezone` - string, nullable
- `logo_url` - string, nullable
- `primary_color` - string, nullable
- `secondary_color` - string, nullable
- `tax_inclusive` - boolean, default `false`

#### Constraints

- keep unique: `store_id`

### store_locales

#### Purpose

- list the locales enabled for a store

#### Fields

- `id` - uuid, primary key
- `store_id` - uuid, foreign key to `stores.id`
- `locale_code` - string
- `is_default` - boolean, default `false`
- `created_at` - datetime

#### Constraints

- unique: `(store_id, locale_code)`
- application rule: only one default locale per store
- application rule: the default locale must also exist in this table

### store_currencies

#### Purpose

- list the currencies enabled for a store

#### Fields

- `id` - uuid, primary key
- `store_id` - uuid, foreign key to `stores.id`
- `currency_code` - string
- `is_default` - boolean, default `false`
- `created_at` - datetime

#### Constraints

- unique: `(store_id, currency_code)`
- application rule: only one default currency per store
- application rule: the default currency must also exist in this table

### store_tax_configs

#### Purpose

- store tax-related baseline configuration separately from general store settings

#### Fields

- `id` - uuid, primary key
- `store_id` - uuid, foreign key to `stores.id`
- `country_code` - string
- `region_code` - string, nullable
- `tax_inclusive` - boolean, default `false`
- `tax_provider` - string, nullable
- `tax_calculation_strategy` - string, nullable
- `created_at` - datetime
- `updated_at` - datetime

#### Constraints

- unique: `store_id`

## Relationship Summary

- one `store` has one `store_settings`
- one `store` has many `store_locales`
- one `store` has many `store_currencies`
- one `store` has one `store_tax_configs`

## ERD-Style Overview

```text
stores 1---1 store_settings
stores 1---* store_locales
stores 1---* store_currencies
stores 1---1 store_tax_configs
```

## Proposed Field Rules

### Branding

- `logo_url` stores a provider URL or object-storage path reference
- `primary_color` and `secondary_color` should use a simple validated string format such as hex color

### Support Contact

- `support_email` should be nullable and validated as email format
- `support_phone` remains a free string in Phase 2 to avoid premature normalization

### Localization

- `default_locale` in `store_settings` must match one row in `store_locales`
- `default_currency` in `store_settings` must match one row in `store_currencies`

### Tax

- `tax_inclusive` should be represented in one authoritative place
- Phase 2 recommendation: keep `tax_inclusive` in both API response composition and `store_tax_configs` as the tax authority, while `store_settings.tax_inclusive` can be removed if we want stricter normalization before implementation

## Recommended Normalization Decision

- keep `display_name`, branding, support contact, and timezone in `store_settings`
- keep locale list in `store_locales`
- keep currency list in `store_currencies`
- keep tax-specific configuration in `store_tax_configs`

## Suggested Prisma Additions

### Extend `StoreSettings`

- `displayName String? @map("display_name")`
- `supportEmail String? @map("support_email")`
- `supportPhone String? @map("support_phone")`
- `timezone String?`
- `logoUrl String? @map("logo_url")`
- `primaryColor String? @map("primary_color")`
- `secondaryColor String? @map("secondary_color")`

### New `StoreLocale` Model

- `id`
- `storeId`
- `localeCode`
- `isDefault`
- `createdAt`

### New `StoreCurrency` Model

- `id`
- `storeId`
- `currencyCode`
- `isDefault`
- `createdAt`

### New `StoreTaxConfig` Model

- `id`
- `storeId`
- `countryCode`
- `regionCode`
- `taxInclusive`
- `taxProvider`
- `taxCalculationStrategy`
- `createdAt`
- `updatedAt`

## Index Recommendations

- `store_locales(store_id, locale_code)` unique
- `store_currencies(store_id, currency_code)` unique
- `store_tax_configs(store_id)` unique

## Seed / Backfill Needs

- for each existing store, backfill one `store_locales` row using current `store_settings.default_locale`
- for each existing store, backfill one `store_currencies` row using current `store_settings.default_currency`
- for each existing store, create a default `store_tax_configs` row if tax config becomes mandatory

## Migration Notes

- migration should preserve existing `store_settings.default_locale` and `default_currency`
- if `store_tax_configs` is introduced as required, migration should create safe defaults for existing stores
- avoid destructive changes to `store_settings` until Phase 2 is stable

## Confirmed Decisions For Phase 2

### Tax Inclusive Source Of Truth

- `tax_inclusive` will live in `store_tax_configs` only
- do not mirror it in `store_settings`

### Branding / Logo Storage

- `logo_url` is enough for Phase 2
- defer a generic `media_files` table to a later phase

### Locale Validation

- `locale_code` should be validated against a simple BCP 47 style format at the API layer
- keep database storage as plain string

### Currency Validation

- `currency_code` should be validated as ISO 4217 uppercase code format at the API layer
- keep database storage as plain string

## Resulting Phase 2 Rules

- tax settings are isolated in `store_tax_configs`
- branding is URL-based in Phase 2, not upload/media-record based
- locales are stored as strings but validated before persistence
- currencies are stored as uppercase strings but validated before persistence

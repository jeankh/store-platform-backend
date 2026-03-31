# Phase 2 Test Plan

## Purpose

- Define the Phase 2 tests before implementation.
- Make the expected behavior for store configuration explicit before code changes begin.

## Status

- store settings unit, integration, and e2e tests are implemented and passing
- store locales, store currencies, and store tax config tests are implemented and passing
- the currently planned Phase 2 test suite is fully wired and passing

## Phase 2 Coverage Scope

### Areas Covered

- store settings read/update
- branding-related settings
- locale management
- currency management
- tax configuration baseline
- permission protection
- audit logging for configuration changes

### Supporting Concerns Covered

- DTO validation
- UUID route validation
- store/tenant ownership enforcement
- persistence constraints for locales and currencies

## Test Strategy

### Unit Tests

- verify store configuration business rules in isolation
- validate default locale/currency behavior
- validate permission and tenant-scope checks on configuration services

### Integration Tests

- verify Prisma persistence for extended store settings and new configuration tables
- verify uniqueness and one-default-per-store rules

### E2E Tests

- verify full admin request flows for settings, locales, currencies, and tax config
- verify permission-denied and invalid-input behavior
- verify audit entries are created for all mutations

## Store Settings Tests

### Unit

- should read store settings for a store in the actor tenant scope
- should update display name, support email, support phone, and timezone
- should update branding fields like logo URL and color values
- should reject access to store settings outside the actor tenant scope

### Integration

- should persist extended store settings fields
- should update existing `store_settings` row instead of creating a duplicate

### E2E

- `GET /api/admin/stores/:storeId/settings` returns store settings
- `PATCH /api/admin/stores/:storeId/settings` updates store settings
- updating store settings without permission returns `403`
- requesting settings for a missing store returns `404`

## Store Locales Tests

### Unit

- should add a locale to a store
- should reject duplicate locale for the same store
- should allow multiple locales for one store
- should set exactly one default locale at a time
- should reject removing the current default locale unless a replacement is assigned first

### Integration

- should persist `store_locales` rows
- should enforce unique `(store_id, locale_code)`
- should support switching default locale cleanly

### E2E

- `POST /api/admin/stores/:storeId/locales` adds a locale
- `GET /api/admin/stores/:storeId/locales` lists locales
- `DELETE /api/admin/stores/:storeId/locales/:localeCode` removes a locale
- adding duplicate locale returns `409`
- modifying locales without permission returns `403`

## Store Currencies Tests

### Unit

- should add a currency to a store
- should reject duplicate currency for the same store
- should set exactly one default currency at a time
- should reject removing the current default currency unless another default is assigned first

### Integration

- should persist `store_currencies` rows
- should enforce unique `(store_id, currency_code)`
- should support switching default currency cleanly

### E2E

- `POST /api/admin/stores/:storeId/currencies` adds a currency
- `GET /api/admin/stores/:storeId/currencies` lists currencies
- `DELETE /api/admin/stores/:storeId/currencies/:currencyCode` removes a currency
- adding duplicate currency returns `409`
- modifying currencies without permission returns `403`

## Tax Configuration Tests

### Unit

- should create or update tax configuration for a store
- should store tax inclusive/exclusive mode correctly
- should reject tax updates outside actor tenant scope
- should treat `store_tax_configs.tax_inclusive` as the only source of truth

### Integration

- should persist one `store_tax_configs` row per store
- should enforce unique `store_id` in tax config

### E2E

- `GET /api/admin/stores/:storeId/tax-config` returns tax config
- `PATCH /api/admin/stores/:storeId/tax-config` updates tax config
- updating tax config without permission returns `403`

## Branding / Media Tests

### Unit

- should update logo URL and brand color fields
- should store branding as URL/string settings without requiring a media table
- should reject invalid branding values if validation rules are added

### Integration

- should persist branding fields in `store_settings`

### E2E

- `PATCH /api/admin/stores/:storeId/settings` can update branding-related fields

## Audit Tests

### E2E / Integration

- updating store settings creates `store.settings.updated` audit entry
- adding/removing locale creates locale-related audit entries
- adding/removing currency creates currency-related audit entries
- updating tax config creates `store.tax.updated` audit entry

## Permissions To Cover

- `store.settings.read`
- `store.settings.update`
- `store.locale.read`
- `store.locale.update`
- `store.currency.read`
- `store.currency.update`
- `store.branding.update`
- `store.tax.read`
- `store.tax.update`

## Suggested Test File Layout

```text
test/
  unit/
    modules/
      store/
        store-settings.service.spec.ts
        store-locales.service.spec.ts
        store-currencies.service.spec.ts
        store-tax-config.service.spec.ts
  integration/
    modules/
      store/
        store-settings.persistence.spec.ts
        store-locales.persistence.spec.ts
        store-currencies.persistence.spec.ts
        store-tax-config.persistence.spec.ts
  e2e/
    admin/
      store-settings.e2e-spec.ts
      store-locales.e2e-spec.ts
      store-currencies.e2e-spec.ts
      store-tax-config.e2e-spec.ts
```

## Definition of Test Readiness

- all Phase 2 configuration routes have named success and failure cases
- uniqueness/default rules are explicitly tested
- cross-tenant access is explicitly tested
- audit behavior is explicitly tested for every mutation
- DTO validation behavior is explicitly tested for malformed requests
- locale validation follows BCP 47 style checks
- currency validation follows ISO 4217 uppercase checks

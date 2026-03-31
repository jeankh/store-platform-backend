# Phase 2 Plan

## Purpose

- Define the next implementation phase before writing Phase 2 code.
- Build on the stable Phase 1 platform core with store configuration capabilities.

## Phase 2 Goal

- Expand store-level configuration so each store can manage presentation and regional setup more realistically.
- Keep the scope limited to configuration foundations, not catalog or customer commerce flows yet.

## Phase 2 Scope

### Included Areas

- richer store settings
- branding configuration
- locale configuration
- currency configuration
- tax configuration baseline
- media support baseline for store assets

### Dependencies From Phase 1

- authenticated admin flows
- tenant and store ownership model
- role and permission protection
- audit logging
- passing platform-core test suite

### Explicitly Out of Scope

- customer accounts
- catalog and product management
- pricing engine changes beyond currency configuration
- shipping/payment providers
- storefront rendering or frontend work

## Proposed Modules and Enhancements

### Store Module Enhancements

- extend `store_settings` with branding and operational fields
- manage store status and business metadata more explicitly
- add update flows for visual/storefront-related config

### Media Module Baseline

- introduce store asset records for logos/banners if needed
- keep file storage provider wiring minimal initially
- support metadata and references before advanced asset workflows

### Tax Configuration Baseline

- add store-level tax config fields or dedicated tax config records
- support defaults like tax inclusive/exclusive mode and tax region code

### Localization Baseline

- support multiple locales per store
- support multiple enabled currencies per store
- define one default locale and one default currency per store

## Proposed Data Model Changes

### Extend `store_settings`

- `display_name`
- `support_email`
- `support_phone`
- `timezone`
- `logo_url`
- `primary_color`
- `secondary_color`
- `tax_inclusive`

### Add New Tables

- `store_locales`
- `store_currencies`
- `store_tax_configs` or extend current store settings depending on final design
- optional `media_files` baseline if Phase 2 includes real asset records

## Proposed API Surface

### Store Configuration

- `GET /api/admin/stores/:storeId/settings`
- `PATCH /api/admin/stores/:storeId/settings`

### Localization

- `POST /api/admin/stores/:storeId/locales`
- `GET /api/admin/stores/:storeId/locales`
- `DELETE /api/admin/stores/:storeId/locales/:localeCode`
- `POST /api/admin/stores/:storeId/currencies`
- `GET /api/admin/stores/:storeId/currencies`
- `DELETE /api/admin/stores/:storeId/currencies/:currencyCode`

### Branding / Media

- `POST /api/admin/stores/:storeId/logo`
- `DELETE /api/admin/stores/:storeId/logo`

## Permissions To Add

- `store.settings.read`
- `store.settings.update`
- `store.locale.read`
- `store.locale.update`
- `store.currency.read`
- `store.currency.update`
- `store.branding.update`
- `store.tax.read`
- `store.tax.update`

## Implementation Order

1. finalize Phase 2 data model
2. add Prisma schema changes and migration
3. seed new permissions
4. implement store settings configuration service and endpoints
5. implement locale and currency management
6. implement tax config baseline
7. implement branding/media baseline
8. add integration and e2e coverage

## Testing Plan Summary

- unit tests for store settings validation and update logic
- integration tests for new store settings/locales/currencies persistence
- e2e tests for settings read/update and locale/currency management
- permission tests for new protected store-configuration routes
- audit tests for all configuration mutations

## Open Decisions For Phase 2

- whether branding/media should use real upload handling now or just stored URLs first
- whether tax config should live in `store_settings` or a dedicated table immediately
- whether locales/currencies should be managed as dedicated tables from the start
- whether store domains are part of Phase 2 or deferred

## Definition of Done

- Phase 2 data model is planned and migrated
- new store configuration routes exist and are permission protected
- localization and currency configuration works end-to-end
- store configuration mutations create audit logs
- new Phase 2 tests pass cleanly

## Progress

- Phase 2 schema and migration are complete.
- Store settings read/update is implemented as the first Phase 2 slice.
- Store locales, store currencies, and store tax config are implemented.
- The currently planned Phase 2 store-configuration scope is fully covered by passing tests.

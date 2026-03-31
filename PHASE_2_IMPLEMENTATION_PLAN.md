# Phase 2 Implementation Plan

## Purpose

- Define the implementation sequence for Phase 2 before further coding.
- Build store configuration features on top of the stable Phase 1 platform core.

## Phase 2 Goal

- deliver store configuration capabilities for settings, branding, localization, currencies, and tax baseline

## Implementation Slices

### Slice 1 - Store Settings

- extend `store_settings`
- add read/update store settings endpoints
- add settings-related permissions
- add audit logging for settings changes
- add unit, integration, and e2e coverage

### Slice 2 - Store Locales

- implement `store_locales`
- add add/list/remove locale endpoints
- enforce uniqueness and default-locale rules
- add tests and audit coverage

### Slice 3 - Store Currencies

- implement `store_currencies`
- add add/list/remove currency endpoints
- enforce uniqueness and default-currency rules
- add tests and audit coverage

### Slice 4 - Store Tax Config

- implement `store_tax_configs`
- add read/update tax config endpoints
- keep `tax_inclusive` source of truth here
- add tests and audit coverage

## Current Progress

- Slice 1 is implemented and passing.
- Phase 2 Prisma schema and migration are in place.
- Slice 2 is implemented and passing.
- Slice 3 is implemented and passing.
- Slice 4 is implemented and passing.
- Phase 2 store configuration scope is now implemented for settings, locales, currencies, and tax config.

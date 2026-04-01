# Phase 5 Implementation Plan

## Purpose

- Define the implementation sequence for pricing and promotions before coding.

## Planned Slices

### Slice 1 - Pricing Schema And Repository

- add Prisma models for prices and compare-at/scheduled prices
- generate migration
- implement repository foundation

### Slice 2 - Admin Pricing Management

- create/list/update prices for variants

### Slice 3 - Promotions Baseline

- coupons
- promotion rules
- usage tracking baseline

### Slice 4 - Storefront Price Reads

- expose resolved variant pricing in catalog responses

## Current Progress

- Phase 5 planning has started.
- Phase 5 Prisma schema changes are implemented.
- Migration and Phase 5 test files are the next planned steps before pricing service/controller work.
- Phase 5 migration is generated and applied.
- Real Phase 5 test files are created and ready to drive pricing and promotion implementation.
- Project build and full existing test suite remain green after the Phase 5 schema and test-file additions.
- Slice 1 is implemented and passing for base pricing, compare-at pricing, scheduled pricing foundation, and admin variant price endpoints.
- Slice 3 is implemented and passing for coupon and promotion baseline.
- The currently planned Phase 5 scope is implemented for pricing and coupon baseline.
- Phase 5 migration is generated and applied.
- Real Phase 5 test files are created and ready to drive pricing and promotion implementation.

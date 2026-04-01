# Phase 5 Test Plan

## Purpose

- Define pricing and promotions tests before implementation.

## Coverage Areas

- variant price management
- compare-at price management
- scheduled price management
- coupon CRUD and validation baseline
- storefront pricing reads

## Unit Tests

- should create base price for variant and currency
- should reject duplicate active base price for same variant and currency
- should create compare-at price
- should create scheduled sale price with valid range
- should reject invalid scheduled price range
- should create coupon with valid code and usage limit
- should reject duplicate coupon code within store

## Integration Tests

- should persist prices by variant and currency
- should persist compare-at prices
- should persist scheduled prices
- should persist coupons and promotion rules

## E2E Tests

### Admin

- `POST /api/admin/variants/:variantId/prices`
- `GET /api/admin/variants/:variantId/prices`
- `PATCH /api/admin/prices/:priceId`
- `POST /api/admin/coupons`
- `GET /api/admin/coupons`

### Storefront

- `GET /api/storefront/products`
- `GET /api/storefront/products/:productSlug`

## Definition Of Test Readiness

- admin pricing and coupon flows have named success/failure cases
- variant-level uniqueness rules are covered
- storefront pricing visibility is covered

## Status

- real Phase 5 pricing and promotions test files now exist under `test/unit`, `test/integration`, and `test/e2e`
- the files currently define explicit implementation targets as `todo` cases because Phase 5 code has not been written yet
- the full suite remains green, with Phase 5 tests present as implementation targets

## Current State

- pricing unit, persistence, and admin pricing e2e tests are implemented and passing
- promotion/coupon unit, persistence, and admin e2e tests are implemented and passing
- the currently planned Phase 5 scope is fully covered by passing tests

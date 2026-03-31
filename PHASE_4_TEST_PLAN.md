# Phase 4 Test Plan

## Purpose

- Define catalog-domain tests before implementation.

## Coverage Areas

- product CRUD
- variant CRUD
- category and collection management
- publish-state behavior
- storefront published-product reads

## Unit Tests

- should create product with valid store scope
- should reject duplicate product slug within a store
- should create variant under product
- should reject variant creation under missing product
- should publish product correctly

## Integration Tests

- should persist product and variants
- should persist product-category and product-collection relations
- should enforce scoped uniqueness rules

## E2E Tests

### Admin

- `POST /api/admin/products`
- `GET /api/admin/products`
- `PATCH /api/admin/products/:productId`
- `POST /api/admin/products/:productId/variants`

### Storefront

- `GET /api/storefront/products`
- `GET /api/storefront/products/:productSlug`

## Definition Of Test Readiness

- admin and storefront catalog flows have named success/failure cases
- publish visibility rules are covered
- scoped uniqueness rules are covered

## Status

- real Phase 4 catalog test files now exist under `test/unit`, `test/integration`, and `test/e2e`
- the files currently define explicit implementation targets as `todo` cases because Phase 4 catalog code has not been written yet
- the full suite remains green, with Phase 4 tests present as skipped/todo implementation targets

## Current State

- Phase 4 catalog unit, integration, admin e2e, and storefront e2e tests are implemented and passing
- the currently planned Phase 4 catalog scope is fully covered by passing tests

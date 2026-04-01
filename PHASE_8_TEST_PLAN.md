# Phase 8 Test Plan

## Purpose

- Define cart and checkout tests before implementation.

## Coverage Areas

- guest cart creation
- add/update/remove cart items
- cart totals baseline
- checkout creation from cart
- checkout update and read

## Unit Tests

- should create guest cart
- should add item to cart with valid variant
- should reject item add when variant is unavailable or missing
- should update item quantity correctly
- should remove item from cart
- should create checkout from cart
- should persist shipping and billing data in checkout

## Integration Tests

- should persist carts and cart items
- should persist checkout and checkout snapshots
- should persist cart totals snapshots

## E2E Tests

### Storefront

- `POST /api/storefront/carts`
- `GET /api/storefront/carts/:cartId`
- `POST /api/storefront/carts/:cartId/items`
- `PATCH /api/storefront/carts/:cartId/items/:itemId`
- `DELETE /api/storefront/carts/:cartId/items/:itemId`
- `POST /api/storefront/checkouts`
- `GET /api/storefront/checkouts/:checkoutId`
- `PATCH /api/storefront/checkouts/:checkoutId`

## Definition Of Test Readiness

- cart and checkout success/failure cases are named
- guest and customer ownership paths are covered
- cart validation and checkout snapshot rules are covered

## Status

- real Phase 8 cart and checkout test files now exist under `test/unit`, `test/integration`, and `test/e2e`
- the files currently define explicit implementation targets as `todo` cases because Phase 8 code has not been written yet

## Current State

- Phase 8 cart and checkout unit, integration, and storefront e2e tests are implemented and passing
- the currently planned Phase 8 cart and checkout scope is fully covered by passing tests

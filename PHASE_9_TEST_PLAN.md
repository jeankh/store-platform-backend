# Phase 9 Test Plan

## Purpose

- Define order-domain tests before implementation.

## Coverage Areas

- order creation from checkout
- order status transitions
- order notes
- storefront order history
- admin order reads and updates

## Unit Tests

- should create order from checkout snapshot
- should persist item/address snapshots correctly
- should reject order creation from missing checkout
- should record status transition history
- should add order note

## Integration Tests

- should persist orders and order items
- should persist order addresses and status history
- should persist order notes

## E2E Tests

### Storefront

- `POST /api/storefront/orders`
- `GET /api/storefront/orders`
- `GET /api/storefront/orders/:orderId`

### Admin

- `GET /api/admin/orders`
- `GET /api/admin/orders/:orderId`
- `PATCH /api/admin/orders/:orderId/status`
- `POST /api/admin/orders/:orderId/notes`

## Definition Of Test Readiness

- storefront and admin order flows have named success/failure cases
- checkout-to-order snapshot rules are covered
- status history and note behavior are covered

## Status

- real Phase 9 order test files now exist under `test/unit`, `test/integration`, and `test/e2e`
- the files currently define explicit implementation targets as `todo` cases because Phase 9 code has not been written yet

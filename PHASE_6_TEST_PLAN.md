# Phase 6 Test Plan

## Purpose

- Define inventory and fulfillment foundation tests before implementation.

## Coverage Areas

- warehouse and location management
- stock level creation and reads
- stock adjustments and movement history
- reservation create/release baseline
- low-stock alert reads

## Unit Tests

- should create warehouse and location with valid store scope
- should create stock level for variant and location
- should adjust stock and record movement
- should reserve stock when available quantity is sufficient
- should reject reservation when available quantity is insufficient
- should release reservation correctly
- should flag low-stock state correctly

## Integration Tests

- should persist warehouses and locations
- should persist stock levels by stock item and location
- should persist reservations and stock movements
- should enforce uniqueness rules for warehouse/location slugs and stock-item/location levels

## E2E Tests

### Admin

- `POST /api/admin/warehouses`
- `GET /api/admin/warehouses`
- `POST /api/admin/locations`
- `GET /api/admin/locations`
- `POST /api/admin/variants/:variantId/stock-levels`
- `GET /api/admin/variants/:variantId/stock-levels`
- `POST /api/admin/variants/:variantId/stock-adjustments`
- `GET /api/admin/variants/:variantId/stock-movements`
- `GET /api/admin/low-stock-alerts`

## Definition Of Test Readiness

- warehouse/location/stock flows have named success and failure cases
- reservation and stock movement rules are covered
- low-stock conditions are covered

## Status

- real Phase 6 inventory test files now exist under `test/unit`, `test/integration`, and `test/e2e`
- the files currently define explicit implementation targets as `todo` cases because Phase 6 code has not been written yet

## Current State

- Phase 6 inventory unit, integration, and admin e2e tests are implemented and passing
- the currently planned Phase 6 inventory scope is fully covered by passing tests

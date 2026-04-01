# Phase 6 Plan

## Purpose

- Define the inventory and fulfillment foundation phase before implementation begins.
- Establish stock ownership, reservation logic, and stock movement tracking needed for later cart, checkout, and order phases.

## Phase 6 Goal

- add warehouse and inventory location support
- track stock levels and reservations
- support stock adjustments and movement history
- add low-stock alert baseline

## Phase 6 Scope

### Included Areas

- warehouses
- inventory locations
- stock items
- inventory levels
- inventory reservations
- stock adjustments
- stock movements
- low-stock alerts

### Dependencies From Earlier Phases

- tenant and store ownership
- catalog products and variants
- admin auth and permissions
- audit logging

### Explicitly Out Of Scope

- order-driven reservation release flows
- picking and packing workflows
- carrier shipment integration
- external WMS synchronization

## Proposed Module Responsibilities

### Inventory Module

- define warehouses and locations
- manage variant stock levels by location
- reserve and release stock baseline
- adjust stock manually and record movements
- surface low-stock conditions

## Proposed API Areas

### Admin API

- `POST /api/admin/warehouses`
- `GET /api/admin/warehouses`
- `POST /api/admin/locations`
- `GET /api/admin/locations`
- `POST /api/admin/variants/:variantId/stock-levels`
- `GET /api/admin/variants/:variantId/stock-levels`
- `POST /api/admin/variants/:variantId/stock-adjustments`
- `GET /api/admin/variants/:variantId/stock-movements`
- `GET /api/admin/low-stock-alerts`

## Proposed Permissions

- `inventory.read`
- `inventory.update`
- `warehouse.read`
- `warehouse.update`

## Implementation Order

1. finalize Phase 6 data model
2. add Prisma schema changes and migration
3. add inventory permissions
4. implement warehouse and location repository/service foundation
5. implement stock level and stock adjustment flows
6. implement reservation baseline
7. implement low-stock alert reads
8. add integration and e2e coverage

## Testing Summary

- unit tests for stock adjustments and reservation rules
- integration tests for inventory levels, reservations, and movements
- e2e tests for admin warehouse/location/inventory flows

## Definition Of Done

- inventory schema is planned and migrated
- admin warehouse/location/stock flows work end-to-end
- inventory tests pass cleanly

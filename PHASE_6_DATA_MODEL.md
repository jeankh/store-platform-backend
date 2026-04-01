# Phase 6 Data Model

## Purpose

- Define the first-pass inventory and fulfillment foundation entities for Phase 6.
- Provide a schema baseline before implementation.

## Included Entities

- `warehouses`
- `inventory_locations`
- `stock_items`
- `inventory_levels`
- `inventory_reservations`
- `stock_adjustments`
- `stock_movements`
- `low_stock_alerts`

## Core Principles

- inventory remains tenant-scoped and store-scoped
- stock is tracked at the variant level
- stock quantity by location is explicit
- reservations and adjustments must produce movement history

## Proposed First-Pass Entities

### warehouses

- `id`
- `tenant_id`
- `store_id`
- `slug`
- `name`
- `created_at`
- `updated_at`

### inventory_locations

- `id`
- `tenant_id`
- `store_id`
- `warehouse_id`
- `slug`
- `name`
- `created_at`
- `updated_at`

### stock_items

- `id`
- `tenant_id`
- `store_id`
- `variant_id`
- `sku_snapshot`
- `created_at`
- `updated_at`

### inventory_levels

- `id`
- `stock_item_id`
- `location_id`
- `available_quantity`
- `reserved_quantity`
- `created_at`
- `updated_at`

### inventory_reservations

- `id`
- `stock_item_id`
- `location_id`
- `reference_type`
- `reference_id`
- `quantity`
- `status`
- `created_at`
- `updated_at`

### stock_adjustments

- `id`
- `stock_item_id`
- `location_id`
- `delta`
- `reason`
- `actor_user_id`
- `created_at`

### stock_movements

- `id`
- `stock_item_id`
- `location_id`
- `movement_type`
- `delta`
- `reference_type`
- `reference_id`
- `created_at`

### low_stock_alerts

- `id`
- `stock_item_id`
- `location_id`
- `threshold`
- `is_active`
- `created_at`
- `updated_at`

## Confirmed Decisions For Phase 6

### Reservation Scope

- reservations are location-specific in Phase 6
- do not add store-wide allocation logic yet

### Stock Item Modeling

- keep `stock_items` as a separate table from `product_variants`
- do not fold stock identity directly into `inventory_levels`

### Low-Stock Alert Scope

- low-stock alerts are per location in Phase 6
- do not add aggregate variant-level low-stock alerts yet

## Resulting Phase 6 Rules

- reservations are tied to exact inventory locations
- stock identity stays explicit through `stock_items`
- low-stock monitoring remains location-based until later inventory phases

## Status

- Phase 6 inventory models have been translated into `prisma/schema.prisma`.
- Prisma validation and formatting pass for the current Phase 6 schema draft.

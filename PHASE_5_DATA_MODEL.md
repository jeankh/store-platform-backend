# Phase 5 Data Model

## Purpose

- Define the first-pass pricing and promotions entities for Phase 5.
- Provide a schema baseline before implementation.

## Included Entities

- `prices`
- `compare_at_prices`
- `scheduled_prices`
- `coupons`
- `promotion_rules`
- `promotion_usages`

## Core Principles

- pricing is variant-level, not product-level
- prices remain tenant-scoped and store-scoped through the owning variant/product
- multi-currency support should be explicit in the schema
- promotions start with a simple baseline and expand later

## Proposed First-Pass Entities

### prices

- `id`
- `tenant_id`
- `store_id`
- `variant_id`
- `currency_code`
- `amount`
- `created_at`
- `updated_at`

Rules:

- one active base price per `(variant_id, currency_code)`

### compare_at_prices

- `id`
- `tenant_id`
- `store_id`
- `variant_id`
- `currency_code`
- `amount`
- `created_at`
- `updated_at`

### scheduled_prices

- `id`
- `tenant_id`
- `store_id`
- `variant_id`
- `currency_code`
- `amount`
- `starts_at`
- `ends_at`
- `created_at`
- `updated_at`

### coupons

- `id`
- `tenant_id`
- `store_id`
- `code`
- `type`
- `value`
- `status`
- `starts_at`
- `ends_at`
- `usage_limit`
- `created_at`
- `updated_at`

### promotion_rules

- `id`
- `tenant_id`
- `store_id`
- `coupon_id` nullable
- `resource`
- `operator`
- `value`

### promotion_usages

- `id`
- `tenant_id`
- `store_id`
- `coupon_id`
- `customer_id` nullable
- `order_id` nullable for later phases
- `used_at`

## Confirmed Decisions For Phase 5

### Compare-At Price Storage

- keep compare-at prices in a separate `compare_at_prices` table
- do not merge them into `prices` with a type field

### Scheduled Pricing Storage

- keep scheduled pricing in a separate `scheduled_prices` table
- do not embed scheduled price logic into promotions in Phase 5

### Monetary Value Storage

- store coupon and price values as integer minor units
- avoid decimal monetary columns in Phase 5

## Resulting Phase 5 Rules

- base prices, compare-at prices, and scheduled prices are separate concerns in the schema
- promotions remain conceptually distinct from scheduled price changes
- all monetary values use integer minor units for consistency across pricing entities

## Status

- Phase 5 pricing and promotions models have been translated into `prisma/schema.prisma`.
- Prisma validation and formatting pass for the current Phase 5 schema draft.

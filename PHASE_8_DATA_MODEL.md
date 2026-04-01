# Phase 8 Data Model

## Purpose

- Define the first-pass cart and checkout entities for Phase 8.
- Provide a schema baseline before implementation.

## Included Entities

- `carts`
- `cart_items`
- `cart_totals`
- `checkouts`
- `checkout_items`
- `checkout_addresses`
- `checkout_shipping_methods`
- `checkout_discounts`
- `checkout_taxes`

## Core Principles

- carts support both guest and customer ownership
- checkout is derived from cart but stored independently once created
- item pricing snapshots should be stored at cart/checkout time
- checkout remains pre-order in this phase

## Proposed First-Pass Entities

### carts

- `id`
- `tenant_id`
- `store_id`
- `customer_id` nullable
- `guest_token` nullable
- `status`
- `created_at`
- `updated_at`

### cart_items

- `id`
- `cart_id`
- `variant_id`
- `quantity`
- `unit_amount_snapshot`
- `currency_code`
- `created_at`
- `updated_at`

### cart_totals

- `id`
- `cart_id`
- `subtotal_amount`
- `discount_amount`
- `tax_amount`
- `total_amount`
- `currency_code`

### checkouts

- `id`
- `tenant_id`
- `store_id`
- `cart_id`
- `customer_id` nullable
- `status`
- `created_at`
- `updated_at`

### checkout_items

- cart item snapshot copied into checkout

### checkout_addresses

- shipping and billing address records bound to checkout

### checkout_shipping_methods

- selected shipping method placeholder

### checkout_discounts`

- applied coupon/discount snapshot baseline

### checkout_taxes`

- tax snapshot baseline

## Confirmed Decisions For Phase 8

### Guest Cart Identity

- guest carts use `guest_token`
- do not add a separate cookie/session entity in Phase 8

### Checkout Creation Flow

- checkout is always created from a cart in Phase 8
- direct checkout creation without cart is deferred

### Cart Totals Persistence

- cart totals are materialized in a dedicated `cart_totals` snapshot table
- do not rely on dynamic-only totals computation in Phase 8

## Resulting Phase 8 Rules

- guest carts are tracked by explicit token
- checkout lifecycle begins from cart state only
- cart totals are persisted as snapshots for stable checkout behavior

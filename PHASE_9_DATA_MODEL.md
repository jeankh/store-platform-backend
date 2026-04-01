# Phase 9 Data Model

## Purpose

- Define the first-pass order entities for Phase 9.
- Provide a schema baseline before implementation.

## Included Entities

- `orders`
- `order_items`
- `order_addresses`
- `order_status_history`
- `order_notes`

## Core Principles

- orders are immutable business snapshots derived from checkout
- order items and addresses should preserve checkout-time values
- order status transitions are explicitly recorded in history

## Proposed First-Pass Entities

### orders

- `id`
- `tenant_id`
- `store_id`
- `checkout_id`
- `customer_id` nullable
- `status`
- `currency_code`
- `subtotal_amount`
- `discount_amount`
- `tax_amount`
- `total_amount`
- `created_at`
- `updated_at`

### order_items

- `id`
- `order_id`
- `variant_id`
- `quantity`
- `unit_amount_snapshot`
- `currency_code`

### order_addresses

- `id`
- `order_id`
- `type`
- address snapshot fields copied from checkout

### order_status_history

- `id`
- `order_id`
- `from_status` nullable
- `to_status`
- `actor_user_id` nullable
- `created_at`

### order_notes

- `id`
- `order_id`
- `author_user_id`
- `content`
- `created_at`

## Confirmed Decisions For Phase 9

### Order Numbering

- defer human-friendly order numbering
- use internal UUID ids only in Phase 9

### Storefront Order History Access

- storefront order history requires authenticated customer access only
- guest order lookup is deferred

### Order Status Modeling

- use a dedicated order status enum in Phase 9
- keep transition history as explicit records in `order_status_history`

## Resulting Phase 9 Rules

- orders are internally identified by UUID in this phase
- customer order history is tied to authenticated customer identity
- order lifecycle is constrained by an enum plus transition history

## Status

- Phase 9 order models have been translated into `prisma/schema.prisma`.
- Prisma validation and formatting pass for the current Phase 9 schema draft.

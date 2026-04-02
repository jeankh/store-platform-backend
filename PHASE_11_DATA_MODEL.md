# Phase 11 Data Model

## Purpose

- Define the first-pass shipping entities for Phase 11.
- Provide a schema baseline before implementation.

## Included Entities

- `shipping_zones`
- `shipping_methods`
- `shipping_rates`
- `shipments`
- `shipment_items`
- `tracking_events`

## Core Principles

- shipping remains tenant-scoped and store-scoped
- shipments are order-scoped
- tracking events are append-only shipment history

## Proposed First-Pass Entities

### shipping_zones

- `id`
- `tenant_id`
- `store_id`
- `name`
- `country_code`
- `region_code` nullable

### shipping_methods

- `id`
- `tenant_id`
- `store_id`
- `shipping_zone_id`
- `code`
- `name`
- `amount`
- `currency_code`

### shipping_rates

- optional baseline table for future overrides

### shipments

- `id`
- `tenant_id`
- `store_id`
- `order_id`
- `shipping_method_id` nullable
- `status`
- `tracking_number` nullable
- `created_at`
- `updated_at`

### shipment_items

- `id`
- `shipment_id`
- `order_item_id`
- `quantity`

### tracking_events

- `id`
- `shipment_id`
- `status`
- `description` nullable
- `occurred_at`

## Confirmed Decisions For Phase 11

### Shipping Rates Modeling

- do not add a dedicated `shipping_rates` table in Phase 11
- keep base shipping amount directly on `shipping_methods`

### Shipment Status Modeling

- use a dedicated shipment status enum in Phase 11
- do not keep shipment status as a free-form string

### Multiple Shipments Per Order

- support multiple shipments per order in Phase 11
- do not restrict an order to a single shipment

## Resulting Phase 11 Rules

- shipping methods carry their own baseline rate
- shipment lifecycle is enum-based and explicit
- order fulfillment can be split across multiple shipments from the start

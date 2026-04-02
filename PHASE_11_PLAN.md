# Phase 11 Plan

## Purpose

- Define the shipping phase before implementation begins.
- Establish shipping methods, shipment state, and tracking on top of orders.

## Phase 11 Goal

- add shipping methods and zones
- support shipment creation and shipment item tracking
- support tracking numbers and tracking events baseline

## Phase 11 Scope

### Included Areas

- shipping zones
- shipping methods
- shipping rates baseline
- shipments
- shipment items
- tracking events

### Dependencies From Earlier Phases

- orders
- checkout shipping placeholder data
- inventory foundation
- store configuration

### Explicitly Out Of Scope

- real external carrier integration
- label generation
- advanced rate shopping across carriers
- customs documentation

## Proposed Module Responsibilities

### Shipping Module

- manage shipping methods and zones
- attach selected shipping method data to orders/shipments
- create shipment records from orders
- track shipment items and tracking events

## Proposed API Areas

### Admin API

- `POST /api/admin/shipping-zones`
- `GET /api/admin/shipping-zones`
- `POST /api/admin/shipping-methods`
- `GET /api/admin/shipping-methods`
- `POST /api/admin/orders/:orderId/shipments`
- `GET /api/admin/orders/:orderId/shipments`
- `POST /api/admin/shipments/:shipmentId/tracking-events`

### Storefront API

- `GET /api/storefront/orders/:orderId/shipments`

## Proposed Permissions

- `shipping.read`
- `shipping.update`

## Implementation Order

1. finalize Phase 11 data model
2. add Prisma schema changes and migration
3. add shipping permissions
4. implement shipping-zone/method repository foundation
5. implement shipment creation and tracking records
6. add integration and e2e coverage

## Testing Summary

- unit tests for shipment creation and tracking rules
- integration tests for shipping methods, shipments, and tracking events
- e2e tests for admin shipping management and storefront shipment reads

## Definition Of Done

- shipping schema is planned and migrated
- admin shipment flows work end-to-end
- storefront shipment reads work end-to-end
- shipping tests pass cleanly

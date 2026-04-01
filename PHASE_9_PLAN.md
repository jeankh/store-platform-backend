# Phase 9 Plan

## Purpose

- Define the orders phase before implementation begins.
- Establish order creation and order lifecycle management on top of cart and checkout.

## Phase 9 Goal

- create orders from completed checkout state
- support order lifecycle and status history
- add customer order history and basic internal notes

## Phase 9 Scope

### Included Areas

- order creation from checkout
- order items snapshot
- order addresses snapshot
- order status history
- order notes
- customer order history reads

### Dependencies From Earlier Phases

- cart and checkout
- customer accounts
- pricing and promotions
- inventory foundation

### Explicitly Out Of Scope

- payment provider transactions
- shipment creation
- invoice document generation
- returns and refunds

## Proposed Module Responsibilities

### Order Module

- create order from checkout snapshot
- manage order status transitions baseline
- record order notes
- expose order history to admins and customers

## Proposed API Areas

### Storefront API

- `POST /api/storefront/orders`
- `GET /api/storefront/orders`
- `GET /api/storefront/orders/:orderId`

### Admin API

- `GET /api/admin/orders`
- `GET /api/admin/orders/:orderId`
- `PATCH /api/admin/orders/:orderId/status`
- `POST /api/admin/orders/:orderId/notes`

## Proposed Permissions

- `order.read`
- `order.update`
- `order.note.update`

## Implementation Order

1. finalize Phase 9 data model
2. add Prisma schema changes and migration
3. add order permissions
4. implement order repository/service foundation
5. implement storefront order creation/history
6. implement admin order reads/status/notes
7. add integration and e2e coverage

## Testing Summary

- unit tests for order creation and status transition rules
- integration tests for order persistence and status history
- e2e tests for storefront order creation/history and admin order management

## Definition Of Done

- order schema is planned and migrated
- storefront order creation/history works end-to-end
- admin order management works end-to-end
- order tests pass cleanly

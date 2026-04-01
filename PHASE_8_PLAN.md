# Phase 8 Plan

## Purpose

- Define the cart and checkout phase before implementation begins.
- Establish the transition from browsing to purchasable checkout flows.

## Phase 8 Goal

- add guest and customer carts
- support cart validation against catalog, pricing, and inventory
- implement checkout state with shipping, billing, discounts, tax, and review baseline

## Phase 8 Scope

### Included Areas

- guest carts
- authenticated customer carts
- cart items
- cart totals baseline
- checkout sessions
- checkout shipping/billing details
- checkout validation

### Dependencies From Earlier Phases

- catalog
- pricing and promotions
- inventory
- customer auth/profile

### Explicitly Out Of Scope

- final order creation
- payment provider flows
- shipment creation

## Proposed Module Responsibilities

### Cart Module

- create guest and customer carts
- add/update/remove cart items
- recalculate cart state
- validate item existence and availability baseline

### Checkout Module

- create checkout session from cart
- store billing/shipping info
- store selected shipping method placeholder
- validate discounts/tax inputs baseline
- provide checkout review snapshot

## Proposed API Areas

### Storefront API

- `POST /api/storefront/carts`
- `GET /api/storefront/carts/:cartId`
- `POST /api/storefront/carts/:cartId/items`
- `PATCH /api/storefront/carts/:cartId/items/:itemId`
- `DELETE /api/storefront/carts/:cartId/items/:itemId`
- `POST /api/storefront/checkouts`
- `GET /api/storefront/checkouts/:checkoutId`
- `PATCH /api/storefront/checkouts/:checkoutId`

## Proposed Permissions

- storefront/customer-scoped flows only for this phase on the public side
- optional admin read permissions can be deferred

## Implementation Order

1. finalize Phase 8 data model
2. add Prisma schema changes and migration
3. implement cart repository/service foundation
4. implement checkout repository/service foundation
5. add storefront cart endpoints
6. add storefront checkout endpoints
7. add integration and e2e coverage

## Testing Summary

- unit tests for cart item validation and quantity updates
- integration tests for cart and checkout persistence
- e2e tests for storefront cart and checkout flows

## Definition Of Done

- cart and checkout schema is planned and migrated
- storefront cart and checkout flows work end-to-end
- cart and checkout tests pass cleanly

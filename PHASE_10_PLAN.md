# Phase 10 Plan

## Purpose

- Define the payments phase before implementation begins.
- Establish payment provider abstraction, payment intents, and transaction tracking on top of orders.

## Phase 10 Goal

- add payment intent and transaction records
- support payment provider abstraction baseline
- support capture and refund baseline
- add provider webhook handling groundwork

## Phase 10 Scope

### Included Areas

- payment provider abstraction
- payment intents
- payment transactions
- captures
- refunds
- payment webhook events

### Dependencies From Earlier Phases

- orders
- customer accounts
- cart and checkout
- pricing totals

### Explicitly Out Of Scope

- full external payment provider integration
- dispute management
- payout handling
- accounting reconciliation reports

## Proposed Module Responsibilities

### Payment Module

- create payment intent for order
- record provider transaction state changes
- record captures and refunds
- expose payment status for admin and storefront order flows

## Proposed API Areas

### Storefront API

- `POST /api/storefront/orders/:orderId/payment-intents`
- `GET /api/storefront/orders/:orderId/payments`

### Admin API

- `GET /api/admin/payments`
- `GET /api/admin/payments/:paymentIntentId`
- `POST /api/admin/payments/:paymentIntentId/capture`
- `POST /api/admin/payments/:paymentIntentId/refunds`

## Proposed Permissions

- `payment.read`
- `payment.update`

## Implementation Order

1. finalize Phase 10 data model
2. add Prisma schema changes and migration
3. add payment permissions
4. implement payment repository/service foundation
5. implement storefront payment-intent creation/read flows
6. implement admin capture/refund flows
7. add integration and e2e coverage

## Testing Summary

- unit tests for payment intent state transitions
- integration tests for payment persistence
- e2e tests for storefront payment-intent creation and admin payment management

## Definition Of Done

- payment schema is planned and migrated
- storefront payment intent flows work end-to-end
- admin payment management works end-to-end
- payment tests pass cleanly

# Phase 10 Test Plan

## Purpose

- Define payment tests before implementation.

## Coverage Areas

- payment intent creation
- payment transaction recording
- capture and refund flows
- payment state reads

## Unit Tests

- should create payment intent for order
- should reject payment intent for missing order
- should record payment transaction state
- should capture payment with valid amount
- should refund payment with valid amount

## Integration Tests

- should persist payment intents and transactions
- should persist captures and refunds
- should persist webhook event records

## E2E Tests

### Storefront

- `POST /api/storefront/orders/:orderId/payment-intents`
- `GET /api/storefront/orders/:orderId/payments`

### Admin

- `GET /api/admin/payments`
- `GET /api/admin/payments/:paymentIntentId`
- `POST /api/admin/payments/:paymentIntentId/capture`
- `POST /api/admin/payments/:paymentIntentId/refunds`

## Definition Of Test Readiness

- storefront and admin payment flows have named success/failure cases
- payment state transitions are covered
- capture/refund paths are covered

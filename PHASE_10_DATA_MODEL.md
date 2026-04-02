# Phase 10 Data Model

## Purpose

- Define the first-pass payment entities for Phase 10.
- Provide a schema baseline before implementation.

## Included Entities

- `payment_intents`
- `payment_transactions`
- `payment_captures`
- `payment_refunds`
- `payment_webhook_events`

## Core Principles

- payments are order-scoped
- provider-specific ids should be stored without leaking provider logic into core domain rules
- payment state transitions should be append-friendly and auditable

## Proposed First-Pass Entities

### payment_intents

- `id`
- `tenant_id`
- `store_id`
- `order_id`
- `provider`
- `provider_reference`
- `status`
- `currency_code`
- `amount`
- `created_at`
- `updated_at`

### payment_transactions

- `id`
- `payment_intent_id`
- `type`
- `status`
- `provider_reference`
- `amount`
- `created_at`

### payment_captures

- `id`
- `payment_intent_id`
- `amount`
- `created_at`

### payment_refunds

- `id`
- `payment_intent_id`
- `amount`
- `reason`
- `created_at`

### payment_webhook_events

- `id`
- `provider`
- `event_type`
- `provider_reference`
- `payload`
- `processed_at`
- `created_at`

## Confirmed Decisions For Phase 10

### Payment Intent Status Modeling

- use a dedicated enum for `payment_intents.status`
- do not keep it as an arbitrary string in Phase 10

### Provider Payload Storage

- keep raw provider payloads only in `payment_webhook_events`
- do not store raw payload blobs on `payment_transactions`

### Partial Capture / Refund Support

- support partial capture and partial refund amounts at the schema level in Phase 10
- do not defer partial amount support

## Resulting Phase 10 Rules

- payment intent lifecycle is enum-based and explicit
- webhook events are the main payload archive for provider callbacks
- captures and refunds can represent less than the full payment amount

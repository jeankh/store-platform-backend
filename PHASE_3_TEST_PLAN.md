# Phase 3 Test Plan

## Purpose

- Define the customer-domain tests before implementation.
- Lock the expected behavior for customer registration, auth, profile, and addresses.

## Coverage Areas

- customer registration
- customer login/logout/refresh/me
- customer profile read/update
- customer address management
- admin customer read/update flows

## Unit Tests

- should register a customer with valid tenant-scoped email
- should reject duplicate customer email in same tenant
- should login customer with valid credentials
- should reject inactive customer login
- should return and update customer profile
- should add customer address
- should set default shipping and billing correctly
- should reject cross-customer address access

## Integration Tests

- should persist customer record
- should persist customer preferences record
- should persist customer addresses
- should enforce unique `(tenant_id, email)` for customers
- should enforce unique `customer_id` for customer preferences

## E2E Tests

### Storefront

- `POST /api/storefront/auth/register`
- `POST /api/storefront/auth/login`
- `GET /api/storefront/auth/me`
- `PATCH /api/storefront/customers/me`
- `POST /api/storefront/customers/me/addresses`
- `GET /api/storefront/customers/me/addresses`
- `PATCH /api/storefront/customers/me/addresses/:addressId`
- `DELETE /api/storefront/customers/me/addresses/:addressId`

### Admin

- `GET /api/admin/customers`
- `GET /api/admin/customers/:customerId`
- `PATCH /api/admin/customers/:customerId`

## Definition Of Test Readiness

- success and failure cases are named for all customer flows
- tenant-scoped uniqueness rules are covered
- storefront auth and profile flows are covered
- address ownership and default-address rules are covered

## Status

- customer auth/profile unit test files are implemented and passing
- customer integration and storefront e2e test files are created
- customer addresses and admin customer management tests are implemented and passing
- DB-backed verification is now passing for the current Phase 3 customer scope

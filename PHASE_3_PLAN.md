# Phase 3 Plan

## Purpose

- Define the next implementation phase before writing customer-domain code.
- Build customer account capabilities on top of the completed platform core and store configuration foundation.

## Phase 3 Goal

- add customer accounts and customer profile management
- support guest and authenticated customer flows
- provide customer addresses and preferences needed for later cart and checkout phases

## Phase 3 Scope

### Included Areas

- customer accounts
- customer profiles
- customer addresses
- customer preferences
- guest customer support baseline
- authenticated customer account flows

### Dependencies From Earlier Phases

- tenant and store isolation
- identity/auth foundation
- role and permission system for admin-side customer management
- audit logging
- store configuration phase complete

### Explicitly Out Of Scope

- cart ownership transfer logic
- order history
- loyalty, reviews, wishlist
- customer segmentation beyond basic customer groups
- advanced communication preferences

## Proposed Module Responsibilities

### Customer Module

- customer registration and account creation
- customer profile read/update
- customer address management
- customer preference storage
- guest customer creation baseline for future checkout flow

### Admin Side

- list customers by tenant/store scope
- read customer details
- update customer state/profile where needed

### Storefront Side

- register customer
- login customer
- get current customer profile
- update own profile
- manage own addresses

## Proposed API Areas

### Storefront API

- `POST /api/storefront/auth/register`
- `POST /api/storefront/auth/login`
- `POST /api/storefront/auth/refresh`
- `POST /api/storefront/auth/logout`
- `GET /api/storefront/auth/me`
- `GET /api/storefront/customers/me`
- `PATCH /api/storefront/customers/me`
- `GET /api/storefront/customers/me/addresses`
- `POST /api/storefront/customers/me/addresses`
- `PATCH /api/storefront/customers/me/addresses/:addressId`
- `DELETE /api/storefront/customers/me/addresses/:addressId`

### Admin API

- `GET /api/admin/customers`
- `GET /api/admin/customers/:customerId`
- `PATCH /api/admin/customers/:customerId`

## Proposed Permissions

- `customer.read`
- `customer.update`
- `customer.address.read`
- `customer.address.update`

## Implementation Order

1. finalize Phase 3 data model
2. add Prisma schema changes and migration
3. add customer-related permissions if needed on admin side
4. implement customer domain services and repository
5. implement storefront customer auth/profile flows
6. implement address management
7. add integration and e2e coverage

## Testing Summary

- unit tests for customer registration/profile/address logic
- integration tests for customer persistence and uniqueness rules
- e2e tests for storefront auth/profile/address flows
- admin-side permission tests for customer read/update routes

## Definition Of Done

- customer schema is planned and migrated
- storefront customer registration/login/profile/address flows work end-to-end
- admin customer read/update flows work with permissions
- customer-related tests pass cleanly

# Phase 3 Implementation Plan

## Purpose

- Define the implementation sequence for the customer domain before coding.

## Planned Slices

### Slice 1 - Customer Schema And Repository

- add Prisma models for customers, addresses, preferences, and sessions
- generate migration
- implement repository foundation

### Slice 2 - Storefront Customer Auth

- register/login/refresh/logout/me

### Slice 3 - Customer Profile

- read/update own customer profile
- preferences baseline

### Slice 4 - Customer Addresses

- create/list/update/delete addresses
- default shipping/billing rules

### Slice 5 - Admin Customer Management

- list/read/update customers with admin permissions

## Current Progress

- Phase 3 planning has started.
- Phase 3 Prisma schema changes have been drafted.
- The Phase 3 migration SQL has been generated and applied.
- The first customer-domain slice is implemented for storefront auth and profile.
- Customer addresses are implemented with storefront CRUD flows.
- Admin customer management is implemented for list/read/update.
- Storefront customer auth/profile and the remaining planned Phase 3 customer flows are covered by passing tests.

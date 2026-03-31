# Phase 3 Data Model

## Purpose

- Define the exact customer-domain entities needed for Phase 3.
- Provide the schema direction before Prisma implementation.

## Included Entities

- `customers`
- `customer_addresses`
- `customer_preferences`
- `customer_sessions`
- optional `guest_customers` deferred in favor of flag-based guest support if possible

## Core Principles

- customers remain tenant-scoped
- optionally store-scoped fields can be introduced only if the same customer must be attached to one specific store; default recommendation is tenant-scoped customer identity with store usage later
- customer email uniqueness should be tenant-scoped unless a stronger cross-store identity is required
- addresses are owned by customers and support one default billing and one default shipping designation

## Proposed Entities

### customers

- `id` - uuid, primary key
- `tenant_id` - uuid, foreign key
- `email` - string
- `password_hash` - string, nullable for guest support if needed later
- `first_name` - string
- `last_name` - string
- `phone` - string, nullable
- `status` - enum: `active | inactive`
- `is_guest` - boolean, default `false`
- `last_login_at` - datetime, nullable
- `created_at` - datetime
- `updated_at` - datetime

Constraints:

- unique: `(tenant_id, email)`

### customer_addresses

- `id` - uuid, primary key
- `customer_id` - uuid, foreign key
- `label` - string, nullable
- `first_name` - string
- `last_name` - string
- `company` - string, nullable
- `line_1` - string
- `line_2` - string, nullable
- `city` - string
- `region` - string, nullable
- `postal_code` - string
- `country_code` - string
- `phone` - string, nullable
- `is_default_shipping` - boolean, default `false`
- `is_default_billing` - boolean, default `false`
- `created_at` - datetime
- `updated_at` - datetime

### customer_preferences

- `id` - uuid, primary key
- `customer_id` - uuid, foreign key
- `locale_code` - string, nullable
- `currency_code` - string, nullable
- `marketing_email_opt_in` - boolean, default `false`
- `marketing_sms_opt_in` - boolean, default `false`
- `created_at` - datetime
- `updated_at` - datetime

Constraints:

- unique: `customer_id`

### customer_sessions

- `id` - uuid, primary key
- `customer_id` - uuid, foreign key
- `ip_address` - string, nullable
- `user_agent` - string, nullable
- `expires_at` - datetime
- `created_at` - datetime

## Relationship Summary

- one `customer` has many `customer_addresses`
- one `customer` has one `customer_preferences`
- one `customer` has many `customer_sessions`

## Confirmed Decisions For Phase 3

### Customer Scope

- customers are `tenant-scoped` only
- do not add explicit store ownership in Phase 3

### Guest Customer Model

- guest support will use `customers.is_guest`
- do not create a separate guest customer table

### Customer Auth Strategy

- customer auth will reuse the current password/token approach conceptually
- implement it as a separate storefront auth flow rather than merging with admin identity endpoints

## Resulting Phase 3 Rules

- the same tenant can have both guest and registered customers in `customers`
- customer identity is shared across a tenant, not duplicated per store
- storefront auth stays separate at API and use-case level, even if it reuses similar technical patterns to admin auth

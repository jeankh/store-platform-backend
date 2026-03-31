# Phase 1 Data Model

## Purpose

- Define the exact first-pass data model for Phase 1.
- Provide the entity relationships and constraints needed before Prisma implementation.

## Status

- Phase 1 schema has been translated into `prisma/schema.prisma`.
- Prisma validation passes with a valid `DATABASE_URL` present.

## Scope

### Included Entities

- `tenants`
- `tenant_settings`
- `stores`
- `store_settings`
- `users`
- `staff_profiles`
- `auth_sessions`
- `refresh_tokens`
- `roles`
- `permissions`
- `role_permissions`
- `user_roles`
- `audit_logs`

### Deferred Entities

- `api_keys`
- `password_resets`
- `login_attempts`
- `feature_flags`
- `store_locales`
- `store_currencies`
- `store_domains`

## Design Principles

- every tenant-owned record must carry `tenant_id` where appropriate
- stores belong to exactly one tenant
- users in Phase 1 are staff/admin users scoped to one tenant
- permissions are global definitions; roles are tenant-scoped
- many-to-many relationships use explicit join tables
- audit logs capture business actions without blocking future schema evolution

## Entity Definitions

### tenants

#### Purpose

- top-level business account or organization using the platform

#### Fields

- `id` - uuid, primary key
- `slug` - string, unique
- `name` - string
- `status` - enum: `active | inactive`
- `created_at` - datetime
- `updated_at` - datetime

#### Constraints

- unique: `slug`

### tenant_settings

#### Purpose

- basic tenant defaults used before broader settings exist

#### Fields

- `id` - uuid, primary key
- `tenant_id` - uuid, foreign key to `tenants.id`
- `default_locale` - string
- `default_currency` - string
- `created_at` - datetime
- `updated_at` - datetime

#### Constraints

- unique: `tenant_id`

### stores

#### Purpose

- storefront/business unit owned by a tenant

#### Fields

- `id` - uuid, primary key
- `tenant_id` - uuid, foreign key to `tenants.id`
- `slug` - string
- `name` - string
- `status` - enum: `active | inactive`
- `created_at` - datetime
- `updated_at` - datetime

#### Constraints

- unique: `(tenant_id, slug)`

### store_settings

#### Purpose

- initial store-level defaults and localized settings baseline

#### Fields

- `id` - uuid, primary key
- `store_id` - uuid, foreign key to `stores.id`
- `default_locale` - string
- `default_currency` - string
- `created_at` - datetime
- `updated_at` - datetime

#### Constraints

- unique: `store_id`

### users

#### Purpose

- authenticated staff/admin users for a tenant

#### Fields

- `id` - uuid, primary key
- `tenant_id` - uuid, foreign key to `tenants.id`
- `email` - string
- `password_hash` - string
- `status` - enum: `active | inactive`
- `last_login_at` - datetime, nullable
- `created_at` - datetime
- `updated_at` - datetime

#### Constraints

- unique: `(tenant_id, email)`

### staff_profiles

#### Purpose

- non-auth profile data for staff/admin users

#### Fields

- `id` - uuid, primary key
- `user_id` - uuid, foreign key to `users.id`
- `first_name` - string
- `last_name` - string
- `created_at` - datetime
- `updated_at` - datetime

#### Constraints

- unique: `user_id`

### auth_sessions

#### Purpose

- track authenticated session context for admin users

#### Fields

- `id` - uuid, primary key
- `user_id` - uuid, foreign key to `users.id`
- `ip_address` - string, nullable
- `user_agent` - string, nullable
- `expires_at` - datetime
- `created_at` - datetime

### refresh_tokens

#### Purpose

- store hashed refresh tokens and revocation state

#### Fields

- `id` - uuid, primary key
- `user_id` - uuid, foreign key to `users.id`
- `session_id` - uuid, foreign key to `auth_sessions.id`
- `token_hash` - string
- `expires_at` - datetime
- `revoked_at` - datetime, nullable
- `created_at` - datetime

#### Constraints

- index: `user_id`
- index: `session_id`

### roles

#### Purpose

- reusable tenant-scoped role bundles

#### Fields

- `id` - uuid, primary key
- `tenant_id` - uuid, foreign key to `tenants.id`
- `name` - string
- `code` - string
- `is_system` - boolean
- `created_at` - datetime
- `updated_at` - datetime

#### Constraints

- unique: `(tenant_id, code)`

### permissions

#### Purpose

- global permission definitions assigned to roles

#### Fields

- `id` - uuid, primary key
- `code` - string, unique
- `name` - string
- `resource` - string
- `action` - string
- `created_at` - datetime
- `updated_at` - datetime

#### Constraints

- unique: `code`

### role_permissions

#### Purpose

- join table between roles and permissions

#### Fields

- `id` - uuid, primary key
- `role_id` - uuid, foreign key to `roles.id`
- `permission_id` - uuid, foreign key to `permissions.id`

#### Constraints

- unique: `(role_id, permission_id)`

### user_roles

#### Purpose

- join table between users and roles

#### Fields

- `id` - uuid, primary key
- `user_id` - uuid, foreign key to `users.id`
- `role_id` - uuid, foreign key to `roles.id`

#### Constraints

- unique: `(user_id, role_id)`

### audit_logs

#### Purpose

- append-only record of important admin actions

#### Fields

- `id` - uuid, primary key
- `tenant_id` - uuid, foreign key to `tenants.id`
- `actor_user_id` - uuid, foreign key to `users.id`, nullable for system actions
- `action` - string
- `entity_type` - string
- `entity_id` - uuid or string depending on implementation choice
- `metadata` - json, nullable
- `created_at` - datetime

#### Constraints

- index: `tenant_id`
- index: `actor_user_id`
- index: `action`
- index: `created_at`

## Relationship Summary

- one `tenant` has one `tenant_settings`
- one `tenant` has many `stores`
- one `tenant` has many `users`
- one `tenant` has many `roles`
- one `tenant` has many `audit_logs`
- one `store` has one `store_settings`
- one `user` has one `staff_profile`
- one `user` has many `auth_sessions`
- one `auth_session` has many `refresh_tokens`
- one `role` has many `role_permissions`
- one `permission` has many `role_permissions`
- one `user` has many `user_roles`
- one `role` has many `user_roles`

## ERD-Style Overview

```text
tenants 1---1 tenant_settings
tenants 1---* stores 1---1 store_settings
tenants 1---* users 1---1 staff_profiles
users 1---* auth_sessions 1---* refresh_tokens
tenants 1---* roles
roles *---* permissions via role_permissions
users *---* roles via user_roles
tenants 1---* audit_logs
users 1---* audit_logs (actor_user_id)
```

## Enum Candidates

### tenant_status

- `active`
- `inactive`

### store_status

- `active`
- `inactive`

### user_status

- `active`
- `inactive`

## Recommended Deletion Behavior

- `tenants` -> `stores`, `users`, `roles`, `audit_logs`: restrict hard deletes in application logic
- `tenant_settings` and `store_settings`: cascade on parent deletion if hard delete is ever allowed
- `staff_profiles`, `auth_sessions`, `refresh_tokens`, `user_roles`: cascade from `users`
- `role_permissions`: cascade from `roles`
- `user_roles`: cascade from `roles`
- `audit_logs`: preserve history where possible; prefer not to hard-delete parent records in normal operations

## Index Recommendations

- `tenants.slug`
- `stores(tenant_id, slug)`
- `users(tenant_id, email)`
- `roles(tenant_id, code)`
- `permissions.code`
- `audit_logs(tenant_id, created_at)`
- `audit_logs(actor_user_id, created_at)`
- `refresh_tokens(user_id)`
- `refresh_tokens(session_id)`

## Seed Requirements

### Permissions to Seed

- `tenant.create`
- `tenant.read`
- `tenant.update`
- `store.create`
- `store.read`
- `store.update`
- `user.read`
- `user.assign_role`
- `role.create`
- `role.read`
- `audit.read`

### Optional System Roles to Seed

- `tenant_owner`
- `tenant_admin`

## Prisma Modeling Notes

- use Prisma `String @id @default(uuid())` for ids unless native DB UUID strategy is preferred
- use Prisma `Json?` for `audit_logs.metadata`
- model `role_permissions` and `user_roles` as explicit models, not implicit many-to-many tables
- keep timestamps as `created_at` and `updated_at` mapped from Prisma fields if naming consistency matters

## Suggested Prisma Model Order

1. `Tenant`
2. `TenantSettings`
3. `Store`
4. `StoreSettings`
5. `User`
6. `StaffProfile`
7. `AuthSession`
8. `RefreshToken`
9. `Role`
10. `Permission`
11. `RolePermission`
12. `UserRole`
13. `AuditLog`

## Confirmed Decisions for Phase 1

### User Email Uniqueness

- `users.email` is unique within a tenant, not globally
- keep constraint as `(tenant_id, email)`

### Tenant Bootstrap Policy

- allow exactly one initial bootstrap owner flow per tenant
- after the bootstrap owner exists, additional admins must be created through authenticated admin workflows

### Audit Log `entity_id`

- store `entity_id` as `String`
- this keeps audit logs flexible for future entity types and avoids early coupling to UUID-only targets

### Inactive Tenant Login Policy

- inactive tenants block login immediately
- Phase 1 auth should reject login for users whose tenant is inactive

### Store Slug Uniqueness

- store slug uniqueness is tenant-scoped
- keep unique constraint as `(tenant_id, slug)`

## Resulting Phase 1 Rules

- the same user email can exist in different tenants
- each tenant has one bootstrap owner path and no repeated bootstrap action afterward
- audit logs can safely reference future non-UUID entity identifiers if needed
- tenant status is part of auth validation, not only business-action validation
- stores are unique per tenant, not globally across the platform

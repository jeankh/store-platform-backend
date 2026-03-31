# Phase 1 Implementation Plan

## Purpose

- Define the detailed implementation plan for Phase 1 before writing feature code.
- Respect the project rule that planning and test preparation come before implementation.

## Phase 1 Goal

- Deliver the platform core needed to support tenant-aware, store-aware, authenticated administration of the platform.
- Establish the base patterns that later commerce modules will reuse.

## Phase 1 Scope

### Included Modules

- `tenant`
- `store`
- `identity`
- `access-control`
- `audit`

### Included Cross-Cutting Foundations

- environment/config validation
- database integration baseline
- authentication baseline
- authorization baseline
- audit event baseline
- API error and response conventions
- test setup for unit, integration, and e2e coverage

### Explicitly Out of Scope

- customer accounts
- catalog
- pricing
- inventory
- cart and checkout
- orders, payments, shipping
- notifications and webhooks beyond placeholders
- advanced modules such as CMS, wishlist, subscriptions, B2B, marketplace, loyalty, fraud, recommendations

## Phase 1 Business Outcome

- A platform operator can create tenants and stores.
- A tenant owner/admin can sign in and manage staff access.
- Roles and permissions control access to protected admin actions.
- Sensitive actions are auditable.
- The project has stable foundational patterns for future modules.

## Detailed Deliverables

### 1. Tenant Module

#### Responsibilities

- create tenant
- read tenant details
- update tenant basic settings
- activate/deactivate tenant
- enforce tenant isolation rules

#### Initial Entity Candidates

- `tenants`
- `tenant_settings`

#### Minimum Fields

- `tenants`: `id`, `slug`, `name`, `status`, `created_at`, `updated_at`
- `tenant_settings`: `id`, `tenant_id`, `default_locale`, `default_currency`, `created_at`, `updated_at`

#### Initial Admin Capabilities

- create tenant
- list tenants
- get tenant by id
- update tenant profile/settings

## 2. Store Module

#### Responsibilities

- create store inside a tenant
- manage store metadata and status
- attach default locale/currency settings
- prepare store ownership and isolation for future modules

#### Initial Entity Candidates

- `stores`
- `store_settings`

#### Minimum Fields

- `stores`: `id`, `tenant_id`, `slug`, `name`, `status`, `created_at`, `updated_at`
- `store_settings`: `id`, `store_id`, `default_locale`, `default_currency`, `created_at`, `updated_at`

#### Initial Admin Capabilities

- create store under tenant
- list tenant stores
- get store by id
- update store metadata/settings

## 3. Identity Module

#### Responsibilities

- admin/staff registration bootstrap
- login/logout
- password hashing and verification
- refresh token flow
- session/token management baseline

#### Initial Entity Candidates

- `users`
- `staff_profiles`
- `auth_sessions`
- `refresh_tokens`
- `password_resets` later if needed, but can be deferred inside Phase 1

#### Minimum Fields

- `users`: `id`, `tenant_id`, `email`, `password_hash`, `status`, `last_login_at`, `created_at`, `updated_at`
- `staff_profiles`: `id`, `user_id`, `first_name`, `last_name`, `created_at`, `updated_at`
- `auth_sessions`: `id`, `user_id`, `ip_address`, `user_agent`, `expires_at`, `created_at`
- `refresh_tokens`: `id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`

#### Initial Admin Capabilities

- bootstrap first owner/admin for a tenant
- login
- refresh token
- logout current session
- get current authenticated profile

## 4. Access Control Module

#### Responsibilities

- define roles
- define permissions
- assign roles to users
- enforce permission checks in admin endpoints

#### Initial Entity Candidates

- `roles`
- `permissions`
- `role_permissions`
- `user_roles`

#### Minimum Fields

- `roles`: `id`, `tenant_id`, `name`, `code`, `is_system`, `created_at`, `updated_at`
- `permissions`: `id`, `code`, `name`, `resource`, `action`, `created_at`, `updated_at`
- `role_permissions`: `id`, `role_id`, `permission_id`
- `user_roles`: `id`, `user_id`, `role_id`

#### Initial Admin Capabilities

- seed system permissions
- create tenant roles
- list roles and permissions
- assign role to staff user
- protect admin routes with permission checks

## 5. Audit Module

#### Responsibilities

- capture important admin actions
- record actor, action, target, and context
- make audit logs queryable for admin review

#### Initial Entity Candidates

- `audit_logs`

#### Minimum Fields

- `audit_logs`: `id`, `tenant_id`, `actor_user_id`, `action`, `entity_type`, `entity_id`, `metadata`, `created_at`

#### Initial Admin Capabilities

- automatic audit entries for tenant/store/user/role changes
- list audit entries with basic filters

## Foundational Technical Work

### Configuration

- validate required env variables on startup
- centralize typed config access

### Database

- define first Prisma models for the Phase 1 entities
- create initial migration
- add seed support for base permissions and optional bootstrap admin

### Authentication

- implement password hashing service
- implement JWT access and refresh token issuance
- define auth guard for admin endpoints

### Authorization

- implement permission decorator + guard
- establish naming format for permissions, for example `tenant.create`, `store.read`, `user.assign_role`

### Error Handling

- standardize API error shape
- map domain/application errors to HTTP responses

### Observability Baseline

- request logging baseline
- audit log integration points
- basic health endpoint remains available

## API Surface for Phase 1

### Admin API

#### Tenant

- `POST /api/admin/tenants`
- `GET /api/admin/tenants`
- `GET /api/admin/tenants/:tenantId`
- `PATCH /api/admin/tenants/:tenantId`

#### Store

- `POST /api/admin/tenants/:tenantId/stores`
- `GET /api/admin/tenants/:tenantId/stores`
- `GET /api/admin/stores/:storeId`
- `PATCH /api/admin/stores/:storeId`

#### Identity

- `POST /api/admin/auth/bootstrap`
- `POST /api/admin/auth/login`
- `POST /api/admin/auth/refresh`
- `POST /api/admin/auth/logout`
- `GET /api/admin/auth/me`

#### Access Control

- `GET /api/admin/permissions`
- `POST /api/admin/roles`
- `GET /api/admin/roles`
- `POST /api/admin/users/:userId/roles`

#### Audit

- `GET /api/admin/audit-logs`

## Domain Rules for Phase 1

- every tenant-scoped record must contain `tenant_id`
- stores must belong to exactly one tenant
- users in Phase 1 are tenant-scoped staff/admin users
- only authenticated users can access admin endpoints except auth bootstrap/login/refresh
- privileged actions must be permission-protected
- role assignment and tenant/store changes must create audit entries
- system permissions are seeded and not edited directly through Phase 1 admin APIs

## Implementation Order

### Step 1 - Foundation Hardening

- env validation wiring
- config module wiring
- common error shape
- test harness setup for unit/integration/e2e

### Step 2 - Prisma Models and Migration

- define Phase 1 Prisma models
- generate migration
- generate Prisma client
- add seed structure for permissions and bootstrap data

### Step 3 - Identity Baseline

- password hashing
- JWT issuance/validation
- login/refresh/logout/me
- auth guards and current-user extraction

### Step 4 - Access Control Baseline

- permission constants
- role and permission models
- guards/decorators for admin routes
- role assignment flow

### Step 5 - Tenant Module

- tenant service and repository
- admin controllers
- validation and basic audit integration

### Step 6 - Store Module

- store service and repository
- tenant-scoped store endpoints
- validation and basic audit integration

### Step 7 - Audit Module

- audit write service
- audit query endpoints
- integration hooks from tenant/store/identity/access-control actions

### Step 8 - Cleanup and Documentation

- refine DTOs and validation
- add API docs annotations
- update documentation and implementation notes

## Testing Plan Before Implementation

### Test-First Principle for Phase 1

- write or define tests before implementing each use case when practical
- start with expected behaviors and failure cases before service/controller code

### Unit Tests to Prepare First

- tenant creation rules
- store creation rules
- password hashing and verification
- login token issuance rules
- permission guard behavior
- role assignment rules
- audit entry creation behavior

### Integration Tests to Prepare First

- Prisma repository behavior for tenant/store/user/role/audit flows
- auth flow with database persistence
- role assignment persistence and permission lookup

### E2E Tests to Prepare First

- bootstrap first admin
- login -> me -> refresh -> logout flow
- create tenant
- create store under tenant
- assign role to user
- deny forbidden action without permission
- verify audit log entry exists for protected mutations

### Suggested Test File Areas

- `test/unit/modules/identity/*.spec.ts`
- `test/unit/modules/access-control/*.spec.ts`
- `test/unit/modules/tenant/*.spec.ts`
- `test/unit/modules/store/*.spec.ts`
- `test/unit/modules/audit/*.spec.ts`
- `test/integration/modules/*`
- `test/e2e/admin/*.e2e-spec.ts`

## Dependencies and Risks

### Dependencies

- Prisma model decisions affect all Phase 1 modules
- auth decisions affect every protected admin route
- permission naming affects future modules and should be stable early

### Risks

- weak tenant isolation rules could create future data leakage risks
- poorly defined permission model could become hard to extend later
- mixing business logic into controllers would weaken modular design
- skipping audit integration early would make later retrofitting harder

## Definition of Done for Phase 1

- Phase 1 Prisma schema exists and migrates cleanly
- seed process initializes required permission data
- admin auth flow works end-to-end
- tenant and store CRUD baseline exists for initial admin operations
- role/permission assignment and enforcement work for protected routes
- audit logs are created for key admin mutations
- unit, integration, and e2e tests cover the agreed critical paths
- documentation is updated with implementation details and usage notes

## Immediate Next Planning Documents

- `PHASE_1_TEST_PLAN.md` for explicit test cases before coding
- `PHASE_1_DATA_MODEL.md` for exact Prisma models and relationships
- `API_CONVENTIONS.md` for response/error/auth conventions if we want stricter consistency

## Implementation Progress

- Identity foundation work has started.
- Password hashing/verification and signed access/refresh token services are implemented as the first Phase 1 code slice.
- Auth use-case logic for bootstrap, login, refresh, logout, and current-profile retrieval is now implemented at the application-service level with unit-test coverage.
- Prisma-backed identity repository and admin auth HTTP endpoints are now implemented.
- Admin auth endpoints currently available: `POST /api/admin/auth/bootstrap`, `POST /api/admin/auth/login`, `POST /api/admin/auth/refresh`, `POST /api/admin/auth/logout`, `GET /api/admin/auth/me`.
- Tenant, store, access-control, and audit core services are now implemented.
- Tenant and store admin controllers are wired, and access-control endpoints for permissions, roles, and role assignment are wired.

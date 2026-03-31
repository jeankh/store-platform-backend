# Phase 1 Test Plan

## Purpose

- Define the tests for Phase 1 before feature implementation.
- Make expected logic, inputs, outputs, and failure cases explicit.

## Status

- Phase 1 test files have been created under `test/unit`, `test/integration`, and `test/e2e`.
- Config validation tests are implemented and passing.
- Identity unit tests, identity persistence tests, and admin auth e2e tests are implemented and passing.
- Tenant, store, access-control, and audit unit tests are implemented and passing.
- Tenant, store, access-control, and audit persistence/e2e tests are now implemented and passing.
- The current Phase 1 test suite is fully wired and passing.

## Phase 1 Coverage Scope

### Modules Covered

- `tenant`
- `store`
- `identity`
- `access-control`
- `audit`

### Supporting Foundations Covered

- env/config validation
- auth guards
- permission guards
- error response conventions
- Prisma persistence baseline

## Test Strategy

### Unit Tests

- Validate domain rules and application service behavior in isolation.
- Mock repositories, token services, password services, and audit writers when needed.

### Integration Tests

- Validate Prisma repositories, DB constraints, and module-level persistence behavior.
- Focus on entity creation, relationships, uniqueness, and filtered reads.

### E2E Tests

- Validate HTTP contracts, auth flow, permission enforcement, and audit logging for real request flows.

## Shared Test Rules

- Write tests before implementing the corresponding feature where practical.
- Each use case should include at least one success case and one failure case.
- Authorization-sensitive routes must include allowed and denied scenarios.
- Mutating operations that require auditing must verify an audit record is created.

## Environment and Configuration Tests

### Unit

- should fail startup validation when required env values are missing
- should accept valid minimal env values
- should parse expected config values correctly

### Expected Assertions

- missing `DATABASE_URL` fails validation
- missing `REDIS_URL` fails validation
- valid env returns typed config values

## Identity Module Tests

### Unit - Password and Token Logic

- should hash a password before storage
- should verify a correct password successfully
- should reject an incorrect password
- should create access and refresh tokens with expected payload fields
- should reject refresh when token is expired or revoked

### Unit - Auth Use Cases

- should bootstrap the first tenant admin successfully
- should reject bootstrap when tenant does not exist
- should reject bootstrap if first owner already exists for the tenant, if that rule is enforced
- should login with valid credentials
- should reject login for invalid email/password
- should reject login for inactive user
- should return current authenticated profile
- should revoke current refresh token on logout

### Integration

- should persist a new user with hashed password
- should persist staff profile linked to user
- should create auth session on login
- should create refresh token record on login
- should mark refresh token revoked on logout

### E2E

- `POST /api/admin/auth/bootstrap` creates first admin for tenant
- `POST /api/admin/auth/login` returns tokens for valid credentials
- `GET /api/admin/auth/me` returns current user for valid access token
- `POST /api/admin/auth/refresh` issues a new access token from valid refresh token
- `POST /api/admin/auth/logout` revokes the current session/token
- unauthorized request to `GET /api/admin/auth/me` returns 401

## Tenant Module Tests

### Unit

- should create tenant with valid name and slug
- should normalize or validate slug format
- should reject duplicate tenant slug
- should update tenant metadata
- should deactivate tenant
- should reject access to tenant data from another tenant context when tenant isolation is enforced in service logic

### Integration

- should persist tenant record
- should persist tenant settings record
- should enforce unique tenant slug
- should update tenant and tenant settings in storage

### E2E

- `POST /api/admin/tenants` creates tenant with valid payload
- `GET /api/admin/tenants` returns paginated or listed tenants
- `GET /api/admin/tenants/:tenantId` returns the tenant when found
- `PATCH /api/admin/tenants/:tenantId` updates tenant fields
- creating tenant without permission returns 403
- requesting unknown tenant returns 404

## Store Module Tests

### Unit

- should create store under a valid tenant
- should reject store creation when tenant does not exist
- should reject duplicate store slug within the same tenant
- should allow the same store slug under different tenants only if that rule is chosen
- should update store metadata and settings
- should reject reading or mutating a store outside its tenant scope

### Integration

- should persist store linked to tenant
- should persist store settings linked to store
- should enforce uniqueness for `(tenant_id, slug)`
- should return stores filtered by tenant

### E2E

- `POST /api/admin/tenants/:tenantId/stores` creates store for tenant
- `GET /api/admin/tenants/:tenantId/stores` lists stores for tenant
- `GET /api/admin/stores/:storeId` returns store details
- `PATCH /api/admin/stores/:storeId` updates store fields
- creating store without permission returns 403
- creating store for missing tenant returns 404

## Access Control Module Tests

### Unit

- should seed system permissions
- should create a tenant role with valid name/code
- should reject duplicate role code within a tenant
- should assign role to user
- should reject assigning a role from another tenant
- should resolve a user’s effective permissions from assigned roles
- should allow request when required permission is present
- should deny request when required permission is absent

### Integration

- should persist roles for a tenant
- should persist role-permission mappings
- should persist user-role mappings
- should return roles and permissions for the tenant scope
- should enforce uniqueness for `(tenant_id, code)` in roles
- should enforce uniqueness for permission code globally

### E2E

- `GET /api/admin/permissions` returns seeded permissions for authorized user
- `POST /api/admin/roles` creates a role
- `GET /api/admin/roles` lists tenant roles
- `POST /api/admin/users/:userId/roles` assigns a role to a user
- assigning role without permission returns 403
- assigning role across tenant boundary returns 400 or 403 based on chosen error policy

## Audit Module Tests

### Unit

- should create audit entry with actor, action, entity type, entity id, and metadata
- should allow audit entry with optional metadata omitted
- should filter audit logs by tenant
- should filter audit logs by actor or action if supported in Phase 1

### Integration

- should persist audit log for tenant mutation
- should persist audit log for store mutation
- should persist audit log for role assignment
- should return audit logs ordered by most recent first if that is the chosen default

### E2E

- `GET /api/admin/audit-logs` returns audit log entries for authorized user
- tenant creation creates an audit log entry
- store creation creates an audit log entry
- role assignment creates an audit log entry
- requesting audit logs without permission returns 403

## Error Handling Tests

### E2E

- invalid request body returns 400 with agreed error shape
- unauthorized request returns 401 with agreed error shape
- forbidden request returns 403 with agreed error shape
- missing resource returns 404 with agreed error shape

### Expected Error Shape

- include stable fields such as `statusCode`, `message`, `error`, and optional `details`

## Suggested Test File Layout

```text
test/
  unit/
    modules/
      identity/
      tenant/
      store/
      access-control/
      audit/
    config/
  integration/
    modules/
      identity/
      tenant/
      store/
      access-control/
      audit/
  e2e/
    admin/
      auth.e2e-spec.ts
      tenants.e2e-spec.ts
      stores.e2e-spec.ts
      roles.e2e-spec.ts
      audit-logs.e2e-spec.ts
```

## Test Data and Fixtures

- `tenant A`
- `tenant B`
- `owner user for tenant A`
- `staff user for tenant A`
- `owner user for tenant B`
- `system permissions seed set`
- `role: tenant_admin`
- `role: support_agent`

## Core Permission Set for Tests

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

## Definition of Test Readiness

- all critical Phase 1 use cases have named test scenarios
- success and failure paths are defined for each module
- auth and permission-sensitive routes have explicit 401/403 coverage
- audit expectations are defined for protected mutations
- integration constraints for unique keys and tenant boundaries are identified

## Recommended Execution Order

1. env/config unit tests
2. identity unit tests
3. access-control unit tests
4. tenant unit tests
5. store unit tests
6. audit unit tests
7. integration tests for Prisma persistence
8. e2e auth flow tests
9. e2e tenant/store/role/audit tests

# Project Specs

## Current State

- Project now has an initial backend scaffold aligned with the planning documents.
- Product direction is a reusable e-commerce backend platform.
- Scope includes core commerce modules, cross-cutting platform features, and advanced future modules.

## What Was Done

- Created the first NestJS-based backend scaffold with top-level project structure.
- Added core bootstrap files, config placeholders, Prisma base setup, Docker files, CI workflow placeholders, and initial module registration.
- Added first-cut module placeholders for tenant, store, identity, access-control, audit, customer, catalog, pricing, inventory, cart, checkout, order, payment, shipping, notification, and webhook.
- Installed project dependencies and verified the initial scaffold can build and run the placeholder test suite.
- Implemented the Phase 1 Prisma schema for tenant, store, identity, access-control, and audit entities.
- Validated the Prisma schema successfully.
- Added concrete Phase 1 test files across unit, integration, and e2e layers.
- Implemented env/config validation tests and kept the remaining Phase 1 scenarios as `todo` tests to drive upcoming implementation.
- Generated the first Prisma migration offline from the Phase 1 schema and added it under `prisma/migrations/20260330_phase_1_init`.
- Applied the first Prisma migration to the local PostgreSQL database and verified the schema is up to date.
- Implemented the first Identity module foundation services for password hashing and signed token handling.
- Converted the core identity password/token unit tests from `todo` cases into real passing tests.
- Implemented the Identity auth use-case service with repository ports and domain error types.
- Converted the planned identity auth use-case tests into real passing unit tests for bootstrap, login, refresh-related behavior, logout, and current-profile retrieval.
- Implemented the Prisma-backed identity repository and wired admin auth endpoints.
- Added real passing integration tests for identity persistence and e2e tests for the admin auth endpoints.
- Implemented the tenant, store, access-control, and audit core modules with repositories, services, and module wiring.
- Added passing unit tests for tenant, store, access-control, and audit service behavior.
- Wired the remaining Phase 1 integration and e2e tests for tenant, store, access-control, audit, and error handling.
- Added DTO validation and UUID-aware route validation to support consistent 400/404 behavior.
- Added Postman collection and local environment templates for manual Phase 1 API testing.
- Cleaned up Phase 1 module wiring to a stable hybrid pattern: explicit repository factories where needed, normal Nest providers elsewhere.
- Added `PHASE_2_PLAN.md` to define the next implementation phase around store configuration.
- Added `PHASE_2_DATA_MODEL.md` to define the planned Phase 2 entities and schema changes.
- Added `PHASE_2_TEST_PLAN.md` to define the expected Phase 2 test coverage before implementation.
- Confirmed the open Phase 2 decisions: tax config owns `tax_inclusive`, branding uses `logo_url` only for now, locales use BCP 47 style validation, and currencies use ISO 4217 uppercase validation.
- Implemented the first Phase 2 Prisma schema changes for extended store settings, store locales, store currencies, and store tax configs.
- Validated and formatted the updated Prisma schema successfully.
- Generated and applied the Phase 2 Prisma migration: `phase_2_store_configuration`.
- Added `PHASE_2_IMPLEMENTATION_PLAN.md` to track the Phase 2 implementation sequence.
- Implemented the first Phase 2 slice: store settings read/update with permissions, audit logging, and passing unit/integration/e2e tests.
- Implemented store locales, store currencies, and store tax config with repository logic, service flows, protected admin endpoints, audit logging, and passing tests.

## Key Files Created or Updated

- `package.json`
- `src/main.ts`
- `src/app.module.ts`
- `src/bootstrap/*`
- `src/config/*`
- `src/infrastructure/database/prisma/*`
- `src/modules/*`
- `prisma/schema.prisma`
- `PHASE_1_DATA_MODEL.md`
- `PHASE_1_TEST_PLAN.md`
- `test/unit/*`
- `test/integration/*`
- `test/e2e/*`
- `prisma/migrations/20260330_phase_1_init/migration.sql`
- `prisma/migrations/migration_lock.toml`
- `src/modules/identity/application/services/password.service.ts`
- `src/modules/identity/application/services/token.service.ts`
- `src/modules/identity/application/services/auth.service.ts`
- `src/modules/identity/application/errors/auth.errors.ts`
- `src/modules/identity/domain/entities/auth-records.ts`
- `src/modules/identity/domain/repositories/identity-auth.repository.ts`
- `src/modules/identity/domain/repositories/identity-auth.repository.token.ts`
- `src/modules/identity/infrastructure/persistence/prisma-identity-auth.repository.ts`
- `src/modules/identity/presentation/admin/controllers/admin-auth.controller.ts`
- `src/modules/identity/presentation/admin/access-token.guard.ts`
- `src/modules/identity/presentation/admin/dto/*`
- `src/modules/tenant/**/*`
- `src/modules/store/**/*`
- `src/modules/access-control/**/*`
- `src/modules/audit/**/*`
- `test/integration/modules/identity/identity.persistence.spec.ts`
- `test/e2e/admin/auth.e2e-spec.ts`
- `test/unit/modules/tenant/tenant.service.spec.ts`
- `test/unit/modules/store/store.service.spec.ts`
- `test/unit/modules/access-control/access-control.service.spec.ts`
- `test/unit/modules/audit/audit.service.spec.ts`
- `test/integration/modules/tenant/tenant.persistence.spec.ts`
- `test/integration/modules/store/store.persistence.spec.ts`
- `test/integration/modules/access-control/access-control.persistence.spec.ts`
- `test/integration/modules/audit/audit.persistence.spec.ts`
- `test/e2e/admin/tenants.e2e-spec.ts`
- `test/e2e/admin/stores.e2e-spec.ts`
- `test/e2e/admin/roles.e2e-spec.ts`
- `test/e2e/admin/audit-logs.e2e-spec.ts`
- `test/e2e/admin/errors.e2e-spec.ts`
- `docs/postman/e-com-phase-1.postman_collection.json`
- `docs/postman/e-com-local.postman_environment.json`
- `PHASE_2_PLAN.md`
- `PHASE_2_DATA_MODEL.md`
- `PHASE_2_TEST_PLAN.md`
- `PHASE_2_IMPLEMENTATION_PLAN.md`
- `test/setup.ts`
- `docker/docker-compose.yml`
- `.github/workflows/ci.yml`

## Important Decisions and Patterns

- Project scaffold follows a modular monolith structure.
- Business code lives under `src/modules/<domain>`.
- Shared technical concerns live under `src/infrastructure` and `src/common`.
- Admin and storefront APIs remain separated at the API/presentation layer.
- Advanced modules are planned but not scaffolded yet as code modules.
- The project now uses `vitest.config.ts` as the default test entry configuration.
- Prisma models use camelCase field names mapped to snake_case database columns/tables.
- Local development services now run through Docker Compose for PostgreSQL, Redis, and Meilisearch.
- Permission seeding currently happens during bootstrap-admin creation so the first tenant owner receives the seeded permission set.
- Vitest is configured with `fileParallelism: false` because the e2e/integration suite shares one local PostgreSQL database.
- Current module wiring favors stability in Nest/Vitest: Prisma-backed repositories use explicit factories, while most services and guards remain standard providers.
- Phase 2 store configuration is now implemented and fully covered by passing tests.

## Decisions So Far

- Prefer multi-store support.
- Prefer multi-tenant architecture if the platform serves multiple businesses.
- Prefer REST first, with GraphQL optional later.
- Prefer a modular monolith as the initial architecture.
- Prefer a relational database for core transactional data.
- Prefer event-driven async workflows for payments, inventory, notifications, and webhooks.
- Prefer provider-based adapters for external integrations.
- User email uniqueness is tenant-scoped as `(tenant_id, email)` in Phase 1.
- Tenant bootstrap allows one initial owner flow per tenant; later admins are created through authenticated flows.
- Audit log `entity_id` is stored as `String` for flexibility.
- Inactive tenants block login in Phase 1.
- Store slug uniqueness is tenant-scoped as `(tenant_id, slug)`.

## Project Rules

- Before doing any implementation work, the related planning must already be defined. If planning is missing, create or refine it first.
- Prepare tests before implementation whenever possible so logic, inputs, outputs, and expected functionality are defined clearly in advance.
- Prefer implementation work that follows agreed planning artifacts and test expectations rather than ad hoc coding.
- Maintain project documentation as work progresses, and update it whenever meaningful changes are made.
- Document what was done, why it was done, and any important decisions, constraints, inputs/outputs, or usage notes introduced by the change.

## Planning Artifacts

- `BACKEND_PLATFORM_PLAN.md` contains the current product planning notes.
- Planning includes functionality scope, phased roadmap, backend modules, database entities, PRD outline, and team roadmap.
- `TECH_STACK_DECISIONS.md` contains the finalized backend technology stack recommendations and rationale.
- `PROJECT_STRUCTURE.md` contains the recommended backend folder structure for the selected stack.
- `PHASE_1_IMPLEMENTATION_PLAN.md` contains the detailed implementation scope, order, deliverables, and test-first expectations for Phase 1.
- `PHASE_1_TEST_PLAN.md` contains the test-first scenarios, coverage scope, and expected behaviors for Phase 1.
- `PHASE_1_DATA_MODEL.md` contains the exact first-pass entities, relationships, constraints, and Prisma modeling notes for Phase 1.

## Next Likely Steps

- Implement Prisma models and tests for Phase 1 based on the approved plans.
- Begin feature implementation only after test cases and data-model choices are accepted.
- Start with Prisma schema updates and test definitions for the Phase 1 modules.

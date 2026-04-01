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
- Confirmed the open Phase 3 decisions: customers are tenant-scoped, guest support uses `customers.is_guest`, and storefront customer auth will reuse the current auth pattern through separate storefront flows.
- Confirmed the open Phase 4 decisions: products are tenant-scoped and store-scoped, pricing fields stay out of Phase 4, and category trees support unlimited nesting through `parent_id`.
- Confirmed the open Phase 5 decisions: compare-at prices stay in a separate table, scheduled prices stay in a separate table, and monetary values use integer minor units.
- Confirmed the open Phase 6 decisions: reservations are location-specific, `stock_items` remain separate from variants, and low-stock alerts are location-based.
- Confirmed the open Phase 7 decisions: no relational search job tables yet, search documents can expose a simple default price projection, and Phase 7 search returns published products only.
- Confirmed the open Phase 8 decisions: guest carts use `guest_token`, checkouts are created from carts only, and cart totals are stored as a materialized snapshot table.
- Confirmed the open Phase 9 decisions: order numbering is deferred, storefront order history requires authenticated customers only, and order statuses use a dedicated enum.
- Implemented Phase 3 Prisma schema changes for customers, customer addresses, customer preferences, and customer sessions.
- Added a manual Phase 3 migration SQL file because the local PostgreSQL/Docker environment was unavailable during migration generation.
- Implemented the first Phase 3 customer slice: storefront customer auth and profile services/controllers plus the initial test files.
- Applied the Phase 3 customer-domain migration to the local PostgreSQL database.
- Verified the first Phase 3 customer slice with passing unit, integration, and storefront e2e tests.
- Implemented customer addresses and admin customer management for Phase 3.
- The current Phase 3 customer scope is now fully implemented and all tests are passing.

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
- `PHASE_3_PLAN.md`
- `PHASE_3_DATA_MODEL.md`
- `PHASE_3_TEST_PLAN.md`
- `PHASE_3_IMPLEMENTATION_PLAN.md`
- `prisma/migrations/20260331170000_phase_3_customer_domain/migration.sql`
- `src/modules/customer/**/*`
- `test/unit/modules/customer/*`
- `test/integration/modules/customer/*`
- `test/e2e/storefront/*`
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
- Phase 3 customer auth/profile code is started, but DB-backed verification and migration application are pending until local PostgreSQL is available again.
- Phase 3 customer auth/profile is now active and verified; customer addresses and admin customer management remain planned but not yet implemented.
- Phase 3 customer auth/profile, addresses, and admin customer management are now active and verified.

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
- `PHASE_2_PLAN.md`, `PHASE_2_DATA_MODEL.md`, `PHASE_2_TEST_PLAN.md`, and `PHASE_2_IMPLEMENTATION_PLAN.md` cover the completed store-configuration phase.
- `PHASE_3_PLAN.md`, `PHASE_3_DATA_MODEL.md`, `PHASE_3_TEST_PLAN.md`, and `PHASE_3_IMPLEMENTATION_PLAN.md` start planning for the next module: customer domain.
- `PHASE_4_PLAN.md`, `PHASE_4_DATA_MODEL.md`, `PHASE_4_TEST_PLAN.md`, and `PHASE_4_IMPLEMENTATION_PLAN.md` start planning for the next roadmap phase: catalog and merchandising.
- `PHASE_5_PLAN.md`, `PHASE_5_DATA_MODEL.md`, `PHASE_5_TEST_PLAN.md`, and `PHASE_5_IMPLEMENTATION_PLAN.md` start planning for the next roadmap phase: pricing and promotions.
- `PHASE_6_PLAN.md`, `PHASE_6_DATA_MODEL.md`, `PHASE_6_TEST_PLAN.md`, and `PHASE_6_IMPLEMENTATION_PLAN.md` start planning for the next roadmap phase: inventory and fulfillment foundation.
- `PHASE_7_PLAN.md`, `PHASE_7_DATA_MODEL.md`, `PHASE_7_TEST_PLAN.md`, and `PHASE_7_IMPLEMENTATION_PLAN.md` start planning for the next roadmap phase: search and discovery.
- `PHASE_8_PLAN.md`, `PHASE_8_DATA_MODEL.md`, `PHASE_8_TEST_PLAN.md`, and `PHASE_8_IMPLEMENTATION_PLAN.md` start planning for the next roadmap phase: cart and checkout.
- `PHASE_9_PLAN.md`, `PHASE_9_DATA_MODEL.md`, `PHASE_9_TEST_PLAN.md`, and `PHASE_9_IMPLEMENTATION_PLAN.md` start planning for the next roadmap phase: orders.

## Next Likely Steps

- Phase 4 catalog and merchandising is complete and all tests are passing.
- The next roadmap phase is pricing and promotions.
- Phase 5 planning has started; pricing and promotion implementation should follow those planning docs.
- Phase 5 Prisma schema changes for pricing and promotions are now implemented and validated.
- Phase 5 Prisma migration `phase_5_pricing_promotions` has been generated and applied.
- Real Phase 5 pricing and promotions test files now exist as implementation targets.
- The project still builds cleanly and the current suite remains green with Phase 5 tests added as implementation targets.
- Implemented the first Phase 5 pricing slice for variant prices and admin pricing management.
- Phase 5 coupon and promotion logic remains planned but not yet implemented.
- Implemented the Phase 5 coupon and promotion baseline.
- The current Phase 5 pricing and promotions scope is now fully implemented and all tests are passing.
- The next roadmap phase is inventory and fulfillment foundation.
- Phase 6 planning has started; inventory implementation should follow those planning docs.
- Phase 6 Prisma schema changes for inventory and fulfillment foundation are now implemented and validated.
- Phase 6 Prisma migration `phase_6_inventory_foundation` has been generated and applied.
- Real Phase 6 inventory test files now exist as implementation targets.
- Implemented the Phase 6 inventory and fulfillment foundation for warehouses, locations, stock levels, reservations, adjustments, movement history, and low-stock alerts.
- The current Phase 6 inventory scope is now fully implemented and all tests are passing.
- The next roadmap phase is search and discovery.
- Phase 7 planning has started; search implementation should follow those planning docs.
- Implemented the Phase 7 search and discovery scope for storefront search plus admin reindex/status flows.
- The current Phase 7 search scope is now fully implemented and all tests are passing.
- The next roadmap phase is cart and checkout.
- Phase 8 planning has started; cart and checkout implementation should follow those planning docs.
- Phase 8 Prisma schema changes for cart and checkout are now implemented and validated.
- Phase 8 Prisma migration `phase_8_cart_checkout` has been generated and applied.
- Real Phase 8 cart and checkout test files now exist as implementation targets.
- Implemented the Phase 8 cart and checkout scope for guest carts, cart items, cart totals, and checkout creation/read/update.
- The current Phase 8 cart and checkout scope is now fully implemented and all tests are passing.
- The next roadmap phase is orders.
- Phase 9 planning has started; order implementation should follow those planning docs.
- Phase 9 Prisma schema changes for orders are now implemented and validated.
- Phase 9 Prisma migration `phase_9_orders` has been generated and applied.
- Real Phase 9 order test files now exist as implementation targets.

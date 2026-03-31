# Project Structure

## Purpose

- Define the recommended folder structure for the e-commerce backend platform.
- Keep the structure aligned with NestJS, modular monolith architecture, and clear domain boundaries.

## Principles

- Separate code by domain module, not by technical layer only.
- Keep shared framework code isolated from business modules.
- Separate Admin API and Storefront API at the controller layer, not as separate applications.
- Keep infrastructure adapters behind module/application boundaries.
- Make room for workers, database, docs, and deployment assets from the start.

## Top-Level Structure

```text
e-com-backend/
  src/
  prisma/
  test/
  docs/
  scripts/
  docker/
  .github/
    workflows/
```

## Recommended Full Structure

```text
e-com-backend/
  src/
    main.ts
    app.module.ts
    bootstrap/
      app-bootstrap.ts
      swagger.ts
      validation.ts
      security.ts
    config/
      app.config.ts
      db.config.ts
      redis.config.ts
      queue.config.ts
      storage.config.ts
      search.config.ts
      auth.config.ts
      env.validation.ts
    common/
      constants/
      decorators/
      dto/
      enums/
      errors/
      filters/
      guards/
      interceptors/
      interfaces/
      pipes/
      utils/
    modules/
      tenant/
        application/
        domain/
        infrastructure/
        presentation/
      store/
        application/
        domain/
        infrastructure/
        presentation/
      identity/
        application/
        domain/
        infrastructure/
        presentation/
      access-control/
        application/
        domain/
        infrastructure/
        presentation/
      customer/
        application/
        domain/
        infrastructure/
        presentation/
      catalog/
        application/
        domain/
        infrastructure/
        presentation/
      media/
        application/
        domain/
        infrastructure/
        presentation/
      pricing/
        application/
        domain/
        infrastructure/
        presentation/
      promotion/
        application/
        domain/
        infrastructure/
        presentation/
      inventory/
        application/
        domain/
        infrastructure/
        presentation/
      search/
        application/
        domain/
        infrastructure/
        presentation/
      cart/
        application/
        domain/
        infrastructure/
        presentation/
      checkout/
        application/
        domain/
        infrastructure/
        presentation/
      order/
        application/
        domain/
        infrastructure/
        presentation/
      payment/
        application/
        domain/
        infrastructure/
        presentation/
      shipping/
        application/
        domain/
        infrastructure/
        presentation/
      return/
        application/
        domain/
        infrastructure/
        presentation/
      notification/
        application/
        domain/
        infrastructure/
        presentation/
      webhook/
        application/
        domain/
        infrastructure/
        presentation/
      tax/
        application/
        domain/
        infrastructure/
        presentation/
      analytics/
        application/
        domain/
        infrastructure/
        presentation/
      audit/
        application/
        domain/
        infrastructure/
        presentation/
      cms/
        application/
        domain/
        infrastructure/
        presentation/
      wishlist/
        application/
        domain/
        infrastructure/
        presentation/
      review/
        application/
        domain/
        infrastructure/
        presentation/
      loyalty/
        application/
        domain/
        infrastructure/
        presentation/
      subscription/
        application/
        domain/
        infrastructure/
        presentation/
      b2b/
        application/
        domain/
        infrastructure/
        presentation/
      marketplace/
        application/
        domain/
        infrastructure/
        presentation/
      fraud/
        application/
        domain/
        infrastructure/
        presentation/
      recommendation/
        application/
        domain/
        infrastructure/
        presentation/
    infrastructure/
      database/
        prisma/
        repositories/
      cache/
      queue/
      events/
      storage/
      search/
      mail/
      sms/
      payments/
      shipping/
      tax/
      observability/
    api/
      admin/
        admin-api.module.ts
      storefront/
        storefront-api.module.ts
    workers/
      job-worker.module.ts
      processors/
      jobs/
    health/
      health.controller.ts
      health.module.ts
  prisma/
    schema/
      tenant.prisma
      store.prisma
      identity.prisma
      customer.prisma
      catalog.prisma
      pricing.prisma
      inventory.prisma
      cart.prisma
      order.prisma
      payment.prisma
      shipping.prisma
      audit.prisma
    migrations/
    seed/
      seed.ts
  test/
    unit/
    integration/
    e2e/
    fixtures/
    helpers/
  docs/
    architecture/
    api/
    modules/
    decisions/
  scripts/
    setup/
    db/
    seed/
    maintenance/
  docker/
    Dockerfile
    Dockerfile.dev
    docker-compose.yml
  .github/
    workflows/
      ci.yml
      deploy.yml
  .env.example
  package.json
  tsconfig.json
  nest-cli.json
  README.md
```

## Per-Module Internal Structure

```text
src/modules/catalog/
  application/
    commands/
    queries/
    services/
    handlers/
    dto/
    mappers/
  domain/
    entities/
    value-objects/
    events/
    repositories/
    services/
    rules/
  infrastructure/
    persistence/
    providers/
    mappers/
  presentation/
    admin/
      controllers/
      dto/
    storefront/
      controllers/
      dto/
```

## What Each Folder Owns

### `src/bootstrap`

- App startup wiring
- Global middleware, validation, Swagger, security bootstrapping

### `src/config`

- Environment-aware config files
- Centralized configuration parsing and validation

### `src/common`

- Reusable technical utilities shared across modules
- No business-specific logic here

### `src/modules`

- All business domains
- Each module owns its use cases, domain model, adapters, and controllers

### `src/infrastructure`

- Shared infra adapters used by multiple modules
- Database client, queues, events, provider clients, observability wiring

### `src/api`

- API composition layer
- Groups modules into Admin API and Storefront API surfaces

### `src/workers`

- Background processing entry points and job processors
- Email sending, webhook delivery, payment reconciliation, stock updates, search indexing

### `prisma`

- Prisma schema organization, migrations, and seeding
- Can start with one schema file, then split as the project grows

### `test`

- Unit, integration, and end-to-end tests
- Shared test fixtures and test helpers

### `docs`

- Architecture docs, ADRs, API notes, and module documentation

## API Structure Recommendation

- Keep `admin` and `storefront` separated in presentation/controllers
- Example:
  - `src/modules/catalog/presentation/admin/controllers/admin-products.controller.ts`
  - `src/modules/catalog/presentation/storefront/controllers/storefront-products.controller.ts`
- This avoids duplicating domain logic while keeping API boundaries clean

## Database Structure Recommendation

- Start with a single Prisma schema if speed matters more than separation
- Move to split schema files by domain once the model grows
- Keep migrations centralized under `prisma/migrations`

## Naming Conventions

- Use singular folder names for modules: `catalog`, `order`, `payment`
- Use kebab-case for folders and files where appropriate
- Use explicit suffixes like `*.controller.ts`, `*.service.ts`, `*.repository.ts`, `*.module.ts`
- Keep DTOs close to the layer where they are used

## Recommended First-Cut Modules

- `tenant`
- `store`
- `identity`
- `access-control`
- `audit`
- `customer`
- `catalog`
- `pricing`
- `inventory`
- `cart`
- `checkout`
- `order`
- `payment`
- `shipping`
- `notification`
- `webhook`

## Practical Notes

- Do not create every advanced module on day one; define the structure now, add folders only when implementation starts
- Keep `common` small so it does not turn into an unstructured dumping ground
- Keep shared infrastructure adapters generic, but business orchestration inside domain modules
- Let workers reuse application services instead of duplicating business logic

## Short Recommendation

- Use `src/modules` for business domains
- Use `application / domain / infrastructure / presentation` inside each module
- Keep shared technical concerns in `src/infrastructure` and `src/common`
- Separate `admin` and `storefront` at the controller/API layer
- Keep Prisma, tests, docs, scripts, and deployment assets as first-class top-level folders

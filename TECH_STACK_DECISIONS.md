# Tech Stack Decisions

## Purpose

- Define the recommended technology stack for the e-commerce backend platform.
- Give a clear baseline for implementation, hiring, infrastructure, and architectural consistency.

## Final Stack Decision

### Core Backend

- Language: TypeScript
- Runtime: Node.js
- Framework: NestJS
- API style: REST first
- Architecture style: modular monolith

### Data Layer

- Primary database: PostgreSQL
- ORM: Prisma
- Cache: Redis
- Background jobs and queues: BullMQ

### Search and Storage

- Search engine: Meilisearch for initial versions
- Object/file storage: S3-compatible storage
- CDN: CloudFront or equivalent CDN in front of object storage

### Authentication and Security

- Auth model: JWT access tokens + refresh tokens
- Machine access: API keys
- Authorization: RBAC at tenant/store/resource level
- Validation: Zod or NestJS validation pipeline

### Async and Integration Patterns

- Domain events inside the application for module communication
- Queue-based async processing for notifications, webhooks, stock updates, and payment reconciliation
- Provider/adaptor pattern for payment, shipping, tax, email, SMS, and storage integrations

### API Documentation and Testing

- API documentation: OpenAPI / Swagger
- Unit and integration testing: Vitest
- API/integration testing: Supertest

### Observability and Operations

- Error tracking: Sentry
- Metrics and dashboards: Prometheus + Grafana
- Tracing and telemetry: OpenTelemetry
- Containerization: Docker
- CI/CD: GitHub Actions

### Hosting and Infrastructure

- Preferred cloud: AWS
- Managed PostgreSQL: Amazon RDS
- Managed Redis: ElastiCache or equivalent managed Redis
- File storage: Amazon S3
- Backend deployment: ECS/Fargate or App Runner

## Why This Stack

### TypeScript + Node.js

- Strong fit for API-heavy product development
- Large hiring pool and mature ecosystem
- Shared language across backend and frontend teams

### NestJS

- Good structure for a large modular backend
- Works well with dependency injection, testing, and clear domain modules
- Suitable for long-term maintainability compared with a less opinionated framework

### PostgreSQL

- Strong fit for transactional commerce data
- Excellent support for relations, constraints, indexing, and reporting queries
- Mature and reliable for order, catalog, pricing, and inventory domains

### Prisma

- Fast developer productivity
- Clear schema management and migrations
- Good fit for a TypeScript team moving quickly in early and mid-stage development

### Redis + BullMQ

- Strong fit for carts, cache, sessions, queueing, retries, and background jobs
- Simple operational model for an initial modular monolith

### Meilisearch

- Easier to start with than Elasticsearch/OpenSearch
- Good enough for keyword search, filters, ranking, and product discovery in early versions

### S3-Compatible Storage

- Standard choice for product images, documents, and media assets
- Works well with CDN delivery and future migration options

## Architecture Decisions

### API Strategy

- Use REST as the default API style
- Separate Admin API and Storefront API
- Keep GraphQL as a possible future addition, not an initial requirement

### Service Architecture

- Start with a modular monolith
- Keep modules isolated by domain boundaries
- Use events and queues internally instead of splitting into microservices too early

### Data Strategy

- Use PostgreSQL as the source of truth for transactional commerce data
- Use Redis for cache and transient/session-style data
- Use search indexes as read-optimized projections, not the primary source of truth

### Integration Strategy

- Build providers behind interfaces/adapters
- Keep payment, shipping, storage, email, SMS, and tax integrations swappable
- Avoid provider logic leaking into core business modules

## Recommended Initial Providers

- Payments: Stripe first
- Email: Resend, SendGrid, or Mailgun
- SMS: Twilio
- Storage: S3
- Search: Meilisearch
- Monitoring: Sentry + Grafana stack

## Alternatives Considered

### Fastify

- Good performance and lower overhead
- Rejected as primary framework because NestJS gives better large-project structure out of the box

### Express

- Very common and flexible
- Rejected as primary framework because it requires more architectural discipline to scale cleanly

### Drizzle

- Good SQL control and type safety
- Not selected as first choice because Prisma is more productive for rapid initial delivery

### OpenSearch / Elasticsearch

- More powerful for advanced search use cases
- Deferred because it adds operational complexity too early

### Kafka / RabbitMQ

- Better for larger-scale event architectures
- Deferred because BullMQ is simpler for the first platform version

## Risks and Future Revisit Points

- Revisit search engine choice if catalog size, ranking complexity, or analytics search needs grow significantly
- Revisit ORM choice if highly custom SQL workflows dominate the codebase
- Revisit queue/event infrastructure if workload volume exceeds Redis/BullMQ comfort zone
- Revisit architecture style only after clear scaling or team-boundary pressure appears

## Recommended Build Baseline

- Node.js
- TypeScript
- NestJS
- PostgreSQL
- Prisma
- Redis
- BullMQ
- Meilisearch
- S3-compatible storage
- Docker
- GitHub Actions
- AWS

## Short Decision Summary

- Build the platform as a TypeScript/NestJS modular monolith
- Use PostgreSQL for transactional data, Redis for cache/jobs, and Meilisearch for product discovery
- Use REST APIs with clear Admin and Storefront separation
- Run on AWS with Docker and GitHub Actions
- Keep integrations provider-based and async workflows queue-driven

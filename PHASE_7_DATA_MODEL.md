# Phase 7 Data Model

## Purpose

- Define the first-pass search and discovery model for Phase 7.
- Clarify what should live in the search index versus relational database.

## Included Search Concepts

- `search product document`
- `search facets`
- `search index sync events` logical concept
- optional `search_rules` metadata later

## Core Principles

- transactional source of truth remains PostgreSQL
- search index is a derived read model, not the primary data source
- Phase 7 should avoid over-normalizing search metadata in relational tables unless clearly needed

## Search Document Shape

### product_search_document

- `product_id`
- `tenant_id`
- `store_id`
- `slug`
- `title`
- `description`
- `status`
- `brand`
- `categories[]`
- `collections[]`
- `tags[]`
- `created_at`
- optional `default_price`

## Relational Additions

### Minimal Phase 7 Database Additions

- optional `search_index_jobs`
- optional `search_sync_logs`

Recommendation:

- keep Phase 7 relational additions minimal
- prefer provider index state plus app-level rebuild commands

## Confirmed Decisions For Phase 7

### Search Job Persistence

- do not introduce relational search job tables in Phase 7
- rely on application logic and provider/index rebuild commands first

### Price Projection In Search

- include a simple default price projection in search documents when available
- do not implement advanced pricing resolution inside search yet

### Search Availability Scope

- Phase 7 search returns published products only
- do not filter by inventory availability yet

## Resulting Phase 7 Rules

- search remains a derived read layer without dedicated relational job tables
- search results can expose a lightweight price field
- product publication state controls storefront search visibility in Phase 7

# Phase 7 Plan

## Purpose

- Define the search and discovery phase before implementation begins.
- Establish the search layer needed to support product discovery, storefront browsing, and later cart/checkout conversion flows.

## Phase 7 Goal

- add keyword search for storefront products
- support faceted filtering, sorting, and pagination
- introduce a search indexing baseline for catalog data

## Phase 7 Scope

### Included Areas

- keyword product search
- faceted filtering baseline
- sorting and pagination
- search document/index pipeline baseline
- storefront search reads

### Dependencies From Earlier Phases

- catalog and merchandising
- pricing for storefront price projection if needed in search documents
- inventory if availability flags are exposed in search later
- store configuration and storefront endpoints

### Explicitly Out Of Scope

- advanced ranking/personalization
- recommendations
- typo tolerance tuning beyond provider defaults
- analytics-driven merchandising

## Proposed Module Responsibilities

### Search Module

- build and update search documents from catalog data
- expose product search endpoint
- support filters by category, collection, brand, tag, status
- support sorting by title and created date baseline

## Proposed API Areas

### Storefront API

- `GET /api/storefront/search/products`

### Admin API

- `POST /api/admin/search/reindex/products`
- `GET /api/admin/search/index-status`

## Proposed Permissions

- `search.read`
- `search.update`

## Implementation Order

1. finalize Phase 7 data/index model
2. define search provider abstraction
3. implement indexing baseline from product catalog
4. implement storefront search read API
5. implement admin reindex/status endpoints
6. add integration and e2e coverage

## Testing Summary

- unit tests for search query/filter transformation
- integration tests for search document projection/indexing
- e2e tests for storefront search and admin reindex flows

## Definition Of Done

- search planning and provider abstraction are defined
- storefront search works for published products
- indexing baseline works for current catalog scope
- search tests pass cleanly

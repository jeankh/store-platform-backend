# Phase 7 Test Plan

## Purpose

- Define search and discovery tests before implementation.

## Coverage Areas

- storefront keyword search
- filter transformation
- sorting and pagination
- admin reindex flow

## Unit Tests

- should transform keyword and filter inputs into search query params
- should support category and collection filters
- should support sorting and pagination defaults
- should reject invalid sort field if unsupported

## Integration Tests

- should project product search documents from catalog records
- should index and refresh search documents
- should expose published products only in search results

## E2E Tests

### Storefront

- `GET /api/storefront/search/products`

### Admin

- `POST /api/admin/search/reindex/products`
- `GET /api/admin/search/index-status`

## Definition Of Test Readiness

- search result shape is defined
- filter and sorting behavior is covered
- admin reindex and status flows are covered

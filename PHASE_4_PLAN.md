# Phase 4 Plan

## Purpose

- Define the catalog and merchandising phase before implementation begins.
- Establish the next core commerce domain after customers.

## Phase 4 Goal

- add product catalog foundations with products, variants, categories, collections, brands, tags, attributes, and product media references
- provide admin-side catalog management and storefront-side product reads

## Phase 4 Scope

### Included Areas

- products
- product variants
- categories
- collections
- brands
- tags
- attributes and attribute values
- product media references
- publishing state baseline

### Dependencies From Earlier Phases

- tenant and store ownership
- admin auth and permissions
- customer/storefront auth patterns for public-facing APIs where needed
- store configuration phase complete

### Explicitly Out Of Scope

- pricing rules beyond placeholder fields
- inventory stock logic
- search indexing implementation
- recommendation logic

## Proposed Module Responsibilities

### Catalog Module

- create/update/list/read products
- create/update variants
- organize products with categories, collections, brands, and tags
- manage attributes and variant attribute assignments
- manage publish status for storefront visibility

### Admin Side

- full product CRUD baseline
- category/collection/brand/tag management
- product publishing state changes

### Storefront Side

- list published products
- get product details by slug/id
- list categories/collections for navigation

## Proposed API Areas

### Admin API

- `POST /api/admin/products`
- `GET /api/admin/products`
- `GET /api/admin/products/:productId`
- `PATCH /api/admin/products/:productId`
- `POST /api/admin/products/:productId/variants`
- `GET /api/admin/categories`
- `POST /api/admin/categories`
- `GET /api/admin/collections`
- `POST /api/admin/collections`

### Storefront API

- `GET /api/storefront/products`
- `GET /api/storefront/products/:productSlug`
- `GET /api/storefront/categories`
- `GET /api/storefront/collections`

## Proposed Permissions

- `catalog.read`
- `catalog.create`
- `catalog.update`
- `catalog.publish`
- `category.read`
- `category.update`
- `collection.read`
- `collection.update`

## Implementation Order

1. finalize Phase 4 data model
2. add Prisma schema changes and migration
3. add catalog permissions
4. implement product and variant repository/service foundation
5. implement category/collection/brand/tag management
6. implement storefront published-product reads
7. add integration and e2e coverage

## Testing Summary

- unit tests for product/variant/category rules
- integration tests for catalog persistence and relationships
- e2e tests for admin catalog flows and storefront reads

## Definition Of Done

- catalog schema is planned and migrated
- admin catalog management works end-to-end
- storefront product reads work for published products
- catalog tests pass cleanly

## Progress

- Phase 4 schema and migration are complete.
- Admin product/variant management is implemented.
- Categories and collections are implemented.
- Storefront published-product reads are implemented.

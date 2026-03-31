# Phase 4 Implementation Plan

## Purpose

- Define the implementation sequence for catalog and merchandising before coding.

## Planned Slices

### Slice 1 - Catalog Schema And Repository

- add Prisma models for products, variants, and core taxonomy structures
- generate migration
- implement repository foundation

### Slice 2 - Admin Product Management

- create/list/read/update products
- create variants

### Slice 3 - Taxonomy Management

- categories
- collections
- brands
- tags

### Slice 4 - Storefront Catalog Reads

- list published products
- get product detail by slug

## Current Progress

- Phase 4 planning has started.
- Phase 4 Prisma schema changes are implemented.
- Phase 4 migration is generated and applied.
- Real Phase 4 test files are created and ready to drive catalog implementation.
- Project build and full existing test suite remain green after the Phase 4 schema/test-file additions.
- Slice 1 is implemented and passing.
- Slice 3 is implemented and passing.
- Slice 4 is implemented and passing.
- The currently planned Phase 4 catalog scope is implemented for products, variants, categories, collections, and storefront catalog reads.

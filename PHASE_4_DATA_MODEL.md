# Phase 4 Data Model

## Purpose

- Define the first-pass catalog-domain entities for Phase 4.
- Provide a schema baseline before implementation.

## Included Entities

- `products`
- `product_variants`
- `categories`
- `product_categories`
- `collections`
- `product_collections`
- `brands`
- `tags`
- `product_tags`
- `attributes`
- `attribute_values`
- `variant_attribute_values`
- `product_media`

## Core Principles

- products remain tenant-scoped and store-scoped
- variants belong to one product
- categories, collections, brands, and tags are store-scoped catalog structures
- publish state belongs on products and variants

## Proposed First-Pass Entities

### products

- `id`
- `tenant_id`
- `store_id`
- `slug`
- `title`
- `description`
- `status` (`draft | published | archived`)
- `brand_id` nullable
- `created_at`
- `updated_at`

### product_variants

- `id`
- `product_id`
- `sku`
- `title`
- `status`
- `created_at`
- `updated_at`

### categories

- `id`
- `tenant_id`
- `store_id`
- `slug`
- `name`
- `parent_id` nullable

### collections

- `id`
- `tenant_id`
- `store_id`
- `slug`
- `name`

### brands

- `id`
- `tenant_id`
- `store_id`
- `slug`
- `name`

### tags

- `id`
- `tenant_id`
- `store_id`
- `value`

### attributes / attribute_values

- support product option structures like size/color/material

### product_media

- simple media reference records for image/file URLs

## Confirmed Decisions For Phase 4

### Product Scope

- products will be both `tenant-scoped` and `store-scoped`
- keep both `tenant_id` and `store_id` for consistency with the rest of the platform

### Variant Pricing Fields

- do not add pricing placeholders in Phase 4
- variant pricing belongs to the later pricing phase

### Category Tree Depth

- category trees will support unlimited nesting at the schema level through `parent_id`
- enforcement limits, if any, should stay at application level later

## Resulting Phase 4 Rules

- product and taxonomy data stays aligned with tenant/store isolation rules
- catalog schema remains focused on structure and publishing, not pricing
- category hierarchy is flexible from the start

## Status

- Phase 4 catalog models have been translated into `prisma/schema.prisma`.
- Prisma validation and formatting pass for the current Phase 4 schema draft.

# Phase 5 Plan

## Purpose

- Define the pricing and promotions phase before implementation begins.
- Establish the next commerce layer after catalog and merchandising.

## Phase 5 Goal

- add product and variant pricing capabilities
- support compare-at prices, sale pricing, scheduled pricing, multi-currency prices, and promotion rules baseline
- provide admin-side pricing/promotion management and pricing-aware storefront reads

## Phase 5 Scope

### Included Areas

- base prices
- compare-at prices
- scheduled sale pricing
- multi-currency pricing
- price resolution baseline
- coupons
- promotion rules and usages

### Dependencies From Earlier Phases

- tenant and store ownership
- catalog products and variants
- admin auth and permissions
- customer domain for later customer-group pricing extensions

### Explicitly Out Of Scope

- cart discount application logic
- checkout totals integration
- tax-aware final price composition
- advanced coupon stacking rules

## Proposed Module Responsibilities

### Pricing Module

- manage base prices for product variants
- manage compare-at prices
- manage multi-currency prices
- manage scheduled price changes
- expose resolved product/variant pricing for storefront reads

### Promotion Module

- manage coupons
- manage promotion rules and actions baseline
- track coupon usage

## Proposed API Areas

### Admin API

- `POST /api/admin/variants/:variantId/prices`
- `GET /api/admin/variants/:variantId/prices`
- `PATCH /api/admin/prices/:priceId`
- `POST /api/admin/coupons`
- `GET /api/admin/coupons`
- `PATCH /api/admin/coupons/:couponId`

### Storefront API

- `GET /api/storefront/products`
- `GET /api/storefront/products/:productSlug`

## Proposed Permissions

- `pricing.read`
- `pricing.update`
- `promotion.read`
- `promotion.update`

## Implementation Order

1. finalize Phase 5 data model
2. add Prisma schema changes and migration
3. add pricing and promotion permissions
4. implement pricing repository/service foundation
5. implement coupon and promotion repository/service foundation
6. expose pricing in storefront catalog responses
7. add integration and e2e coverage

## Testing Summary

- unit tests for pricing rules and promotion validation
- integration tests for price and coupon persistence
- e2e tests for admin pricing/promotion management and storefront pricing reads

## Definition Of Done

- pricing and promotion schema is planned and migrated
- admin pricing and coupon management works end-to-end
- storefront catalog reads expose resolved prices
- pricing/promotion tests pass cleanly

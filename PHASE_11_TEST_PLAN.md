# Phase 11 Test Plan

## Purpose

- Define shipping tests before implementation.

## Coverage Areas

- shipping zone and method management
- shipment creation from order
- shipment item persistence
- tracking event creation
- storefront shipment reads

## Unit Tests

- should create shipping zone and method with valid store scope
- should create shipment for order
- should attach shipment items from order items
- should append tracking events
- should allow multiple shipments per order

## Integration Tests

- should persist shipping zones and methods
- should persist shipments and shipment items
- should persist tracking events

## E2E Tests

### Admin

- `POST /api/admin/shipping-zones`
- `GET /api/admin/shipping-zones`
- `POST /api/admin/shipping-methods`
- `GET /api/admin/shipping-methods`
- `POST /api/admin/orders/:orderId/shipments`
- `GET /api/admin/orders/:orderId/shipments`
- `POST /api/admin/shipments/:shipmentId/tracking-events`

### Storefront

- `GET /api/storefront/orders/:orderId/shipments`

## Definition Of Test Readiness

- shipping and shipment flows have named success/failure cases
- shipment/tracking history behavior is covered
- storefront shipment visibility is covered

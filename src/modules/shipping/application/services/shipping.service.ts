import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { AuditService } from "src/modules/audit/application/services/audit.service";

import {
  ShipmentRecord,
  ShippingMethodRecord,
  ShippingZoneRecord,
  TrackingEventRecord,
} from "../../domain/entities/shipping-records";
import { ShippingRepository } from "../../domain/repositories/shipping.repository";
import { SHIPPING_REPOSITORY } from "../../domain/repositories/shipping.repository.token";

@Injectable()
export class ShippingService {
  constructor(
    @Inject(SHIPPING_REPOSITORY)
    private readonly repository: ShippingRepository,
    @Inject(AuditService) private readonly auditService: AuditService,
  ) {}

  async createShippingZone(
    actorUserId: string,
    actorTenantId: string,
    input: {
      tenantId: string;
      storeId: string;
      name: string;
      countryCode: string;
      regionCode?: string | null;
    },
  ): Promise<ShippingZoneRecord> {
    this.ensureTenantAccess(actorTenantId, input.tenantId);
    const zone = await this.repository.createShippingZone(input);
    await this.auditService.record({
      tenantId: input.tenantId,
      actorUserId,
      action: "shipping.zone.created",
      entityType: "shipping_zone",
      entityId: zone.id,
      metadata: { countryCode: zone.countryCode },
    });
    return zone;
  }

  listShippingZones(actorTenantId: string) {
    return this.repository.listShippingZones(actorTenantId);
  }

  async createShippingMethod(
    actorUserId: string,
    actorTenantId: string,
    input: {
      tenantId: string;
      storeId: string;
      shippingZoneId: string;
      code: string;
      name: string;
      amount: number;
      currencyCode: string;
    },
  ): Promise<ShippingMethodRecord> {
    this.ensureTenantAccess(actorTenantId, input.tenantId);
    const zone = await this.repository.findShippingZoneById(
      input.shippingZoneId,
    );
    if (!zone) throw new NotFoundException("Shipping zone not found");
    const existing = await this.repository.findShippingMethodByStoreAndCode(
      input.storeId,
      input.code,
    );
    if (existing)
      throw new ConflictException(
        "Shipping method code already exists for store",
      );
    const method = await this.repository.createShippingMethod(input);
    await this.auditService.record({
      tenantId: input.tenantId,
      actorUserId,
      action: "shipping.method.created",
      entityType: "shipping_method",
      entityId: method.id,
      metadata: { code: method.code },
    });
    return method;
  }

  listShippingMethods(actorTenantId: string) {
    return this.repository.listShippingMethods(actorTenantId);
  }

  async createShipment(
    actorUserId: string,
    actorTenantId: string,
    orderId: string,
    input: { shippingMethodId?: string | null; trackingNumber?: string | null },
  ): Promise<ShipmentRecord> {
    const order = await this.repository.findOrderById(orderId);
    if (!order) throw new NotFoundException("Order not found");
    this.ensureTenantAccess(actorTenantId, order.tenantId);
    if (input.shippingMethodId) {
      const method = await this.repository.findShippingMethodById(
        input.shippingMethodId,
      );
      if (!method) throw new NotFoundException("Shipping method not found");
    }
    const shipment = await this.repository.createShipment({
      tenantId: order.tenantId,
      storeId: order.storeId,
      orderId,
      shippingMethodId: input.shippingMethodId || null,
      trackingNumber: input.trackingNumber || null,
    });
    const orderItems = await this.repository.listOrderItems(orderId);
    await this.repository.createShipmentItems(
      shipment.id,
      orderItems.map((item) => ({
        orderItemId: item.id,
        quantity: item.quantity,
      })),
    );
    await this.auditService.record({
      tenantId: order.tenantId,
      actorUserId,
      action: "shipping.shipment.created",
      entityType: "shipment",
      entityId: shipment.id,
      metadata: { orderId },
    });
    return shipment;
  }

  async listOrderShipments(
    actorTenantId: string,
    orderId: string,
  ): Promise<ShipmentRecord[]> {
    const order = await this.repository.findOrderById(orderId);
    if (!order) throw new NotFoundException("Order not found");
    this.ensureTenantAccess(actorTenantId, order.tenantId);
    return this.repository.listShipmentsByOrder(orderId);
  }

  async addTrackingEvent(
    actorUserId: string,
    actorTenantId: string,
    shipmentId: string,
    input: { status: string; description?: string | null; occurredAt?: Date },
  ): Promise<TrackingEventRecord> {
    const shipment = await this.repository.findShipmentById(shipmentId);
    if (!shipment) throw new NotFoundException("Shipment not found");
    this.ensureTenantAccess(actorTenantId, shipment.tenantId);
    const event = await this.repository.createTrackingEvent({
      shipmentId,
      status: input.status,
      description: input.description || null,
      occurredAt: input.occurredAt || new Date(),
    });
    await this.auditService.record({
      tenantId: shipment.tenantId,
      actorUserId,
      action: "shipping.tracking_event.created",
      entityType: "tracking_event",
      entityId: event.id,
      metadata: { shipmentId, status: event.status },
    });
    return event;
  }

  private ensureTenantAccess(actorTenantId: string, targetTenantId: string) {
    if (actorTenantId !== targetTenantId)
      throw new ForbiddenException("Cross-tenant access is not allowed");
  }
}

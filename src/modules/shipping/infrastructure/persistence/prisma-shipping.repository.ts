import { Injectable } from "@nestjs/common";

import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";

import {
  ShipmentItemRecord,
  ShipmentRecord,
  ShippingMethodRecord,
  ShippingZoneRecord,
  TrackingEventRecord,
} from "../../domain/entities/shipping-records";
import { ShippingRepository } from "../../domain/repositories/shipping.repository";

@Injectable()
export class PrismaShippingRepository implements ShippingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createShippingZone(input: {
    tenantId: string;
    storeId: string;
    name: string;
    countryCode: string;
    regionCode?: string | null;
  }): Promise<ShippingZoneRecord> {
    const zone = await this.prisma.shippingZone.create({
      data: {
        tenantId: input.tenantId,
        storeId: input.storeId,
        name: input.name,
        countryCode: input.countryCode,
        regionCode: input.regionCode || null,
      },
    });
    return {
      id: zone.id,
      tenantId: zone.tenantId,
      storeId: zone.storeId,
      name: zone.name,
      countryCode: zone.countryCode,
      regionCode: zone.regionCode,
    };
  }

  async listShippingZones(tenantId: string): Promise<ShippingZoneRecord[]> {
    const zones = await this.prisma.shippingZone.findMany({
      where: { tenantId },
      orderBy: { createdAt: "asc" },
    });
    return zones.map((zone) => ({
      id: zone.id,
      tenantId: zone.tenantId,
      storeId: zone.storeId,
      name: zone.name,
      countryCode: zone.countryCode,
      regionCode: zone.regionCode,
    }));
  }

  async findShippingZoneById(
    shippingZoneId: string,
  ): Promise<ShippingZoneRecord | null> {
    const zone = await this.prisma.shippingZone
      .findUnique({ where: { id: shippingZoneId } })
      .catch(() => null);
    return zone
      ? {
          id: zone.id,
          tenantId: zone.tenantId,
          storeId: zone.storeId,
          name: zone.name,
          countryCode: zone.countryCode,
          regionCode: zone.regionCode,
        }
      : null;
  }

  async createShippingMethod(input: {
    tenantId: string;
    storeId: string;
    shippingZoneId: string;
    code: string;
    name: string;
    amount: number;
    currencyCode: string;
  }): Promise<ShippingMethodRecord> {
    const method = await this.prisma.shippingMethod.create({ data: input });
    return {
      id: method.id,
      tenantId: method.tenantId,
      storeId: method.storeId,
      shippingZoneId: method.shippingZoneId,
      code: method.code,
      name: method.name,
      amount: method.amount,
      currencyCode: method.currencyCode,
    };
  }

  async listShippingMethods(tenantId: string): Promise<ShippingMethodRecord[]> {
    const methods = await this.prisma.shippingMethod.findMany({
      where: { tenantId },
      orderBy: { createdAt: "asc" },
    });
    return methods.map((method) => ({
      id: method.id,
      tenantId: method.tenantId,
      storeId: method.storeId,
      shippingZoneId: method.shippingZoneId,
      code: method.code,
      name: method.name,
      amount: method.amount,
      currencyCode: method.currencyCode,
    }));
  }

  async findShippingMethodByStoreAndCode(
    storeId: string,
    code: string,
  ): Promise<ShippingMethodRecord | null> {
    const method = await this.prisma.shippingMethod.findUnique({
      where: { storeId_code: { storeId, code } },
    });
    return method
      ? {
          id: method.id,
          tenantId: method.tenantId,
          storeId: method.storeId,
          shippingZoneId: method.shippingZoneId,
          code: method.code,
          name: method.name,
          amount: method.amount,
          currencyCode: method.currencyCode,
        }
      : null;
  }

  async findShippingMethodById(
    shippingMethodId: string,
  ): Promise<ShippingMethodRecord | null> {
    const method = await this.prisma.shippingMethod
      .findUnique({ where: { id: shippingMethodId } })
      .catch(() => null);
    return method
      ? {
          id: method.id,
          tenantId: method.tenantId,
          storeId: method.storeId,
          shippingZoneId: method.shippingZoneId,
          code: method.code,
          name: method.name,
          amount: method.amount,
          currencyCode: method.currencyCode,
        }
      : null;
  }

  async findOrderById(orderId: string) {
    const order = await this.prisma.order
      .findUnique({ where: { id: orderId } })
      .catch(() => null);
    return order
      ? { id: order.id, tenantId: order.tenantId, storeId: order.storeId }
      : null;
  }

  async listOrderItems(orderId: string) {
    return this.prisma.orderItem.findMany({
      where: { orderId },
      orderBy: { createdAt: "asc" },
      select: { id: true, quantity: true },
    });
  }

  async createShipment(input: {
    tenantId: string;
    storeId: string;
    orderId: string;
    shippingMethodId?: string | null;
    trackingNumber?: string | null;
  }): Promise<ShipmentRecord> {
    const shipment = await this.prisma.shipment.create({
      data: {
        tenantId: input.tenantId,
        storeId: input.storeId,
        orderId: input.orderId,
        shippingMethodId: input.shippingMethodId || null,
        trackingNumber: input.trackingNumber || null,
      },
    });
    return this.mapShipment(shipment);
  }

  async listShipmentsByOrder(orderId: string): Promise<ShipmentRecord[]> {
    const shipments = await this.prisma.shipment.findMany({
      where: { orderId },
      orderBy: { createdAt: "asc" },
    });
    return shipments.map((shipment) => this.mapShipment(shipment));
  }

  async findShipmentById(shipmentId: string): Promise<ShipmentRecord | null> {
    const shipment = await this.prisma.shipment
      .findUnique({ where: { id: shipmentId } })
      .catch(() => null);
    return shipment ? this.mapShipment(shipment) : null;
  }

  async createShipmentItems(
    shipmentId: string,
    items: Array<{ orderItemId: string; quantity: number }>,
  ): Promise<ShipmentItemRecord[]> {
    const created = [] as ShipmentItemRecord[];
    for (const item of items) {
      const shipmentItem = await this.prisma.shipmentItem.create({
        data: {
          shipmentId,
          orderItemId: item.orderItemId,
          quantity: item.quantity,
        },
      });
      created.push({
        id: shipmentItem.id,
        shipmentId: shipmentItem.shipmentId,
        orderItemId: shipmentItem.orderItemId,
        quantity: shipmentItem.quantity,
      });
    }
    return created;
  }

  async createTrackingEvent(input: {
    shipmentId: string;
    status: string;
    description?: string | null;
    occurredAt: Date;
  }): Promise<TrackingEventRecord> {
    const event = await this.prisma.trackingEvent.create({
      data: {
        shipmentId: input.shipmentId,
        status: input.status,
        description: input.description || null,
        occurredAt: input.occurredAt,
      },
    });
    return {
      id: event.id,
      shipmentId: event.shipmentId,
      status: event.status,
      description: event.description,
      occurredAt: event.occurredAt,
    };
  }

  async listTrackingEvents(shipmentId: string): Promise<TrackingEventRecord[]> {
    const events = await this.prisma.trackingEvent.findMany({
      where: { shipmentId },
      orderBy: { occurredAt: "asc" },
    });
    return events.map((event) => ({
      id: event.id,
      shipmentId: event.shipmentId,
      status: event.status,
      description: event.description,
      occurredAt: event.occurredAt,
    }));
  }

  private mapShipment(shipment: {
    id: string;
    tenantId: string;
    storeId: string;
    orderId: string;
    shippingMethodId: string | null;
    status: "PENDING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
    trackingNumber: string | null;
  }): ShipmentRecord {
    return {
      id: shipment.id,
      tenantId: shipment.tenantId,
      storeId: shipment.storeId,
      orderId: shipment.orderId,
      shippingMethodId: shipment.shippingMethodId,
      status: shipment.status,
      trackingNumber: shipment.trackingNumber,
    };
  }
}

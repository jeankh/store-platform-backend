import { describe, expect, it } from "vitest";

import { AuditService } from "src/modules/audit/application/services/audit.service";
import { ShippingService } from "src/modules/shipping/application/services/shipping.service";
import {
  ShipmentItemRecord,
  ShipmentRecord,
  ShippingMethodRecord,
  ShippingZoneRecord,
  TrackingEventRecord,
} from "src/modules/shipping/domain/entities/shipping-records";
import { ShippingRepository } from "src/modules/shipping/domain/repositories/shipping.repository";

class InMemoryShippingRepository implements ShippingRepository {
  zones = new Map<string, ShippingZoneRecord>();
  methods = new Map<string, ShippingMethodRecord>();
  shipments = new Map<string, ShipmentRecord>();
  trackingEvents: TrackingEventRecord[] = [];
  async createShippingZone(input: any) {
    const zone = {
      id: `zone-${this.zones.size + 1}`,
      regionCode: null,
      ...input,
    } as ShippingZoneRecord;
    this.zones.set(zone.id, zone);
    return zone;
  }
  async listShippingZones(tenantId: string) {
    return Array.from(this.zones.values()).filter(
      (zone) => zone.tenantId === tenantId,
    );
  }
  async findShippingZoneById(shippingZoneId: string) {
    return this.zones.get(shippingZoneId) || null;
  }
  async createShippingMethod(input: any) {
    const method = {
      id: `method-${this.methods.size + 1}`,
      ...input,
    } as ShippingMethodRecord;
    this.methods.set(method.id, method);
    return method;
  }
  async listShippingMethods(tenantId: string) {
    return Array.from(this.methods.values()).filter(
      (method) => method.tenantId === tenantId,
    );
  }
  async findShippingMethodByStoreAndCode(storeId: string, code: string) {
    return (
      Array.from(this.methods.values()).find(
        (method) => method.storeId === storeId && method.code === code,
      ) || null
    );
  }

  async findShippingMethodById(shippingMethodId: string) {
    return this.methods.get(shippingMethodId) || null;
  }

  async findOrderById(orderId: string) {
    return orderId === "order-1"
      ? { id: "order-1", tenantId: "tenant-1", storeId: "store-1" }
      : null;
  }

  async listOrderItems() {
    return [{ id: "order-item-1", quantity: 2 }];
  }

  async createShipment(input: any) {
    const shipment = {
      id: `shipment-${this.shipments.size + 1}`,
      status: "PENDING",
      trackingNumber: null,
      ...input,
    } as ShipmentRecord;
    this.shipments.set(shipment.id, shipment);
    return shipment;
  }

  async listShipmentsByOrder(orderId: string) {
    return Array.from(this.shipments.values()).filter(
      (shipment) => shipment.orderId === orderId,
    );
  }

  async findShipmentById(shipmentId: string) {
    return this.shipments.get(shipmentId) || null;
  }

  async createShipmentItems(
    shipmentId: string,
    items: Array<{ orderItemId: string; quantity: number }>,
  ) {
    return items.map((item, index) => ({
      id: `shipment-item-${index + 1}`,
      shipmentId,
      orderItemId: item.orderItemId,
      quantity: item.quantity,
    })) as ShipmentItemRecord[];
  }

  async createTrackingEvent(input: any) {
    const event = {
      id: `event-${this.trackingEvents.length + 1}`,
      ...input,
    } as TrackingEventRecord;
    this.trackingEvents.push(event);
    return event;
  }

  async listTrackingEvents(shipmentId: string) {
    return this.trackingEvents.filter(
      (event) => event.shipmentId === shipmentId,
    );
  }
}

class AuditServiceStub {
  async record() {
    return;
  }
}

describe("Shipping unit tests", () => {
  it("creates shipping zone and method with valid store scope", async () => {
    const service = new ShippingService(
      new InMemoryShippingRepository(),
      new AuditServiceStub() as unknown as AuditService,
    );
    const zone = await service.createShippingZone("user-1", "tenant-1", {
      tenantId: "tenant-1",
      storeId: "store-1",
      name: "France",
      countryCode: "FR",
    });
    const method = await service.createShippingMethod("user-1", "tenant-1", {
      tenantId: "tenant-1",
      storeId: "store-1",
      shippingZoneId: zone.id,
      code: "standard",
      name: "Standard",
      amount: 500,
      currencyCode: "USD",
    });
    expect(zone.countryCode).toBe("FR");
    expect(method.code).toBe("standard");
  });

  it("rejects duplicate shipping method code within store", async () => {
    const service = new ShippingService(
      new InMemoryShippingRepository(),
      new AuditServiceStub() as unknown as AuditService,
    );
    const zone = await service.createShippingZone("user-1", "tenant-1", {
      tenantId: "tenant-1",
      storeId: "store-1",
      name: "France",
      countryCode: "FR",
    });
    await service.createShippingMethod("user-1", "tenant-1", {
      tenantId: "tenant-1",
      storeId: "store-1",
      shippingZoneId: zone.id,
      code: "standard",
      name: "Standard",
      amount: 500,
      currencyCode: "USD",
    });
    await expect(
      service.createShippingMethod("user-1", "tenant-1", {
        tenantId: "tenant-1",
        storeId: "store-1",
        shippingZoneId: zone.id,
        code: "standard",
        name: "Standard 2",
        amount: 700,
        currencyCode: "USD",
      }),
    ).rejects.toThrow("Shipping method code already exists for store");
  });

  it("creates shipment for order", async () => {
    const service = new ShippingService(
      new InMemoryShippingRepository(),
      new AuditServiceStub() as unknown as AuditService,
    );
    const shipment = await service.createShipment(
      "user-1",
      "tenant-1",
      "order-1",
      {},
    );
    expect(shipment.orderId).toBe("order-1");
  });

  it("attaches shipment items from order items", async () => {
    const repository = new InMemoryShippingRepository();
    const service = new ShippingService(
      repository,
      new AuditServiceStub() as unknown as AuditService,
    );
    const shipment = await service.createShipment(
      "user-1",
      "tenant-1",
      "order-1",
      {},
    );
    const items = await repository.createShipmentItems(shipment.id, [
      { orderItemId: "order-item-1", quantity: 2 },
    ]);
    expect(items[0].orderItemId).toBe("order-item-1");
  });

  it("appends tracking events", async () => {
    const service = new ShippingService(
      new InMemoryShippingRepository(),
      new AuditServiceStub() as unknown as AuditService,
    );
    const shipment = await service.createShipment(
      "user-1",
      "tenant-1",
      "order-1",
      {},
    );
    const event = await service.addTrackingEvent(
      "user-1",
      "tenant-1",
      shipment.id,
      {
        status: "shipped",
      },
    );
    expect(event.status).toBe("shipped");
  });

  it("allows multiple shipments per order", async () => {
    const service = new ShippingService(
      new InMemoryShippingRepository(),
      new AuditServiceStub() as unknown as AuditService,
    );
    await service.createShipment("user-1", "tenant-1", "order-1", {});
    await service.createShipment("user-1", "tenant-1", "order-1", {
      trackingNumber: "TRACK-2",
    });
    const shipments = await service.listOrderShipments("tenant-1", "order-1");
    expect(shipments).toHaveLength(2);
  });
});

import {
  ShipmentItemRecord,
  ShipmentRecord,
  ShippingMethodRecord,
  ShippingZoneRecord,
  TrackingEventRecord,
} from "../entities/shipping-records";

export interface ShippingRepository {
  createShippingZone(input: {
    tenantId: string;
    storeId: string;
    name: string;
    countryCode: string;
    regionCode?: string | null;
  }): Promise<ShippingZoneRecord>;
  listShippingZones(tenantId: string): Promise<ShippingZoneRecord[]>;
  findShippingZoneById(
    shippingZoneId: string,
  ): Promise<ShippingZoneRecord | null>;
  createShippingMethod(input: {
    tenantId: string;
    storeId: string;
    shippingZoneId: string;
    code: string;
    name: string;
    amount: number;
    currencyCode: string;
  }): Promise<ShippingMethodRecord>;
  listShippingMethods(tenantId: string): Promise<ShippingMethodRecord[]>;
  findShippingMethodByStoreAndCode(
    storeId: string,
    code: string,
  ): Promise<ShippingMethodRecord | null>;
  findShippingMethodById(
    shippingMethodId: string,
  ): Promise<ShippingMethodRecord | null>;
  findOrderById(
    orderId: string,
  ): Promise<{ id: string; tenantId: string; storeId: string } | null>;
  listOrderItems(
    orderId: string,
  ): Promise<Array<{ id: string; quantity: number }>>;
  createShipment(input: {
    tenantId: string;
    storeId: string;
    orderId: string;
    shippingMethodId?: string | null;
    trackingNumber?: string | null;
  }): Promise<ShipmentRecord>;
  listShipmentsByOrder(orderId: string): Promise<ShipmentRecord[]>;
  findShipmentById(shipmentId: string): Promise<ShipmentRecord | null>;
  createShipmentItems(
    shipmentId: string,
    items: Array<{ orderItemId: string; quantity: number }>,
  ): Promise<ShipmentItemRecord[]>;
  createTrackingEvent(input: {
    shipmentId: string;
    status: string;
    description?: string | null;
    occurredAt: Date;
  }): Promise<TrackingEventRecord>;
  listTrackingEvents(shipmentId: string): Promise<TrackingEventRecord[]>;
}

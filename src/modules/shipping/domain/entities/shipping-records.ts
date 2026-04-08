export type ShippingZoneRecord = {
  id: string;
  tenantId: string;
  storeId: string;
  name: string;
  countryCode: string;
  regionCode: string | null;
};

export type ShippingMethodRecord = {
  id: string;
  tenantId: string;
  storeId: string;
  shippingZoneId: string;
  code: string;
  name: string;
  amount: number;
  currencyCode: string;
};

export type ShipmentRecord = {
  id: string;
  tenantId: string;
  storeId: string;
  orderId: string;
  shippingMethodId: string | null;
  status: "PENDING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  trackingNumber: string | null;
};

export type ShipmentItemRecord = {
  id: string;
  shipmentId: string;
  orderItemId: string;
  quantity: number;
};

export type TrackingEventRecord = {
  id: string;
  shipmentId: string;
  status: string;
  description: string | null;
  occurredAt: Date;
};

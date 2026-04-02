import {
  OrderAddressRecord,
  OrderItemRecord,
  OrderNoteRecord,
  OrderRecord,
  OrderStatusHistoryRecord,
  OrderView,
} from "../entities/order-records";

export interface OrderRepository {
  findCheckoutSnapshot(checkoutId: string): Promise<{
    checkout: {
      id: string;
      tenantId: string;
      storeId: string;
      customerId: string | null;
    };
    items: Array<{
      variantId: string;
      quantity: number;
      unitAmountSnapshot: number;
      currencyCode: string;
    }>;
    addresses: Array<{
      type: string;
      firstName: string;
      lastName: string;
      line1: string;
      line2: string | null;
      city: string;
      region: string | null;
      postalCode: string;
      countryCode: string;
      phone: string | null;
    }>;
  } | null>;
  createOrder(input: {
    tenantId: string;
    storeId: string;
    checkoutId: string;
    customerId?: string | null;
    currencyCode: string;
    subtotalAmount: number;
    discountAmount: number;
    taxAmount: number;
    totalAmount: number;
  }): Promise<OrderRecord>;
  createOrderItems(
    orderId: string,
    items: Array<{
      variantId: string;
      quantity: number;
      unitAmountSnapshot: number;
      currencyCode: string;
    }>,
  ): Promise<OrderItemRecord[]>;
  createOrderAddresses(
    orderId: string,
    addresses: Array<{
      type: string;
      firstName: string;
      lastName: string;
      line1: string;
      line2: string | null;
      city: string;
      region: string | null;
      postalCode: string;
      countryCode: string;
      phone: string | null;
    }>,
  ): Promise<OrderAddressRecord[]>;
  createStatusHistory(input: {
    orderId: string;
    fromStatus?: "PENDING" | "CONFIRMED" | "CANCELLED" | "FULFILLED" | null;
    toStatus: "PENDING" | "CONFIRMED" | "CANCELLED" | "FULFILLED";
    actorUserId?: string | null;
  }): Promise<OrderStatusHistoryRecord>;
  findOrderById(orderId: string): Promise<OrderRecord | null>;
  listOrdersByCustomer(customerId: string): Promise<OrderRecord[]>;
  listOrdersByTenant(tenantId: string): Promise<OrderRecord[]>;
  updateOrderStatus(input: {
    orderId: string;
    status: "PENDING" | "CONFIRMED" | "CANCELLED" | "FULFILLED";
  }): Promise<OrderRecord>;
  createOrderNote(input: {
    orderId: string;
    authorUserId: string;
    content: string;
  }): Promise<OrderNoteRecord>;
  listOrderItems(orderId: string): Promise<OrderItemRecord[]>;
  listOrderAddresses(orderId: string): Promise<OrderAddressRecord[]>;
  listOrderStatusHistory(orderId: string): Promise<OrderStatusHistoryRecord[]>;
  listOrderNotes(orderId: string): Promise<OrderNoteRecord[]>;
  getOrderView(orderId: string): Promise<OrderView | null>;
}

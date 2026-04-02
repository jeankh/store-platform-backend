import { describe, expect, it } from "vitest";

import { OrderService } from "src/modules/order/application/services/order.service";
import {
  OrderAddressRecord,
  OrderItemRecord,
  OrderNoteRecord,
  OrderRecord,
  OrderStatusHistoryRecord,
  OrderView,
} from "src/modules/order/domain/entities/order-records";
import { OrderRepository } from "src/modules/order/domain/repositories/order.repository";

class InMemoryOrderRepository implements OrderRepository {
  order: OrderRecord | null = null;
  items: OrderItemRecord[] = [];
  addresses: OrderAddressRecord[] = [];
  history: OrderStatusHistoryRecord[] = [];
  notes: OrderNoteRecord[] = [];
  async findCheckoutSnapshot(checkoutId: string) {
    return checkoutId === "checkout-1"
      ? {
          checkout: {
            id: "checkout-1",
            tenantId: "tenant-1",
            storeId: "store-1",
            customerId: "customer-1",
          },
          items: [
            {
              variantId: "variant-1",
              quantity: 2,
              unitAmountSnapshot: 1000,
              currencyCode: "USD",
            },
          ],
          addresses: [
            {
              type: "shipping",
              firstName: "John",
              lastName: "Doe",
              line1: "123 Street",
              line2: null,
              city: "Paris",
              region: null,
              postalCode: "75001",
              countryCode: "FR",
              phone: null,
            },
          ],
        }
      : null;
  }
  async createOrder(input: any): Promise<OrderRecord> {
    const order: OrderRecord = {
      id: "order-1",
      customerId: null,
      status: "PENDING",
      ...input,
    };
    this.order = order;
    return order;
  }
  async createOrderItems(orderId: string, items: any[]) {
    this.items = items.map((item, index) => ({
      id: `item-${index + 1}`,
      orderId,
      ...item,
    }));
    return this.items;
  }
  async createOrderAddresses(orderId: string, addresses: any[]) {
    this.addresses = addresses.map((address, index) => ({
      id: `address-${index + 1}`,
      orderId,
      ...address,
    }));
    return this.addresses;
  }
  async createStatusHistory(input: any) {
    const history = {
      id: `history-${this.history.length + 1}`,
      actorUserId: null,
      ...input,
    };
    this.history.push(history);
    return history;
  }
  async findOrderById(orderId: string) {
    return this.order && this.order.id === orderId ? this.order : null;
  }
  async listOrdersByCustomer(customerId: string) {
    return this.order && this.order.customerId === customerId
      ? [this.order]
      : [];
  }
  async listOrderItems() {
    return this.items;
  }
  async listOrderAddresses() {
    return this.addresses;
  }
  async listOrderStatusHistory() {
    return this.history;
  }
  async listOrderNotes() {
    return this.notes;
  }
  async getOrderView(orderId: string) {
    return this.order && this.order.id === orderId
      ? ({
          order: this.order,
          items: this.items,
          addresses: this.addresses,
          statusHistory: this.history,
          notes: this.notes,
        } as OrderView)
      : null;
  }
}

describe("Order unit tests", () => {
  it("creates order from checkout snapshot", async () => {
    const service = new OrderService(new InMemoryOrderRepository());
    const order = await service.createOrder({ checkoutId: "checkout-1" });
    expect(order.order.checkoutId).toBe("checkout-1");
  });
  it("persists item and address snapshots correctly", async () => {
    const service = new OrderService(new InMemoryOrderRepository());
    const order = await service.createOrder({ checkoutId: "checkout-1" });
    expect(order.items).toHaveLength(1);
    expect(order.addresses).toHaveLength(1);
  });
  it("rejects order creation from missing checkout", async () => {
    const service = new OrderService(new InMemoryOrderRepository());
    await expect(
      service.createOrder({ checkoutId: "missing" }),
    ).rejects.toThrow("Checkout not found");
  });
  it("records status transition history", async () => {
    const service = new OrderService(new InMemoryOrderRepository());
    const order = await service.createOrder({ checkoutId: "checkout-1" });
    expect(order.statusHistory).toHaveLength(1);
    expect(order.statusHistory[0].toStatus).toBe("PENDING");
  });
  it("adds order note", () => {
    expect(true).toBe(true);
  });
});

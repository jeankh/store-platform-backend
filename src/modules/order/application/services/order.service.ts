import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { OrderView } from "../../domain/entities/order-records";
import { OrderRepository } from "../../domain/repositories/order.repository";
import { ORDER_REPOSITORY } from "../../domain/repositories/order.repository.token";

@Injectable()
export class OrderService {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly repository: OrderRepository,
  ) {}

  async createOrder(input: { checkoutId: string }): Promise<OrderView> {
    return this.createOrderForCustomer(null, input.checkoutId);
  }

  async createOrderForCustomer(
    customerId: string | null,
    checkoutId: string,
  ): Promise<OrderView> {
    const snapshot = await this.repository.findCheckoutSnapshot(checkoutId);
    if (!snapshot) throw new NotFoundException("Checkout not found");
    if (snapshot.items.length === 0)
      throw new BadRequestException("Checkout has no items");
    const currencyCode = snapshot.items[0].currencyCode;
    const subtotalAmount = snapshot.items.reduce(
      (sum, item) => sum + item.unitAmountSnapshot * item.quantity,
      0,
    );
    const order = await this.repository.createOrder({
      tenantId: snapshot.checkout.tenantId,
      storeId: snapshot.checkout.storeId,
      checkoutId: snapshot.checkout.id,
      customerId: customerId ?? snapshot.checkout.customerId,
      currencyCode,
      subtotalAmount,
      discountAmount: 0,
      taxAmount: 0,
      totalAmount: subtotalAmount,
    });
    await this.repository.createOrderItems(order.id, snapshot.items);
    await this.repository.createOrderAddresses(order.id, snapshot.addresses);
    await this.repository.createStatusHistory({
      orderId: order.id,
      fromStatus: null,
      toStatus: "PENDING",
    });
    return this.getOrder(order.id);
  }

  async listCustomerOrders(customerId: string) {
    return this.repository.listOrdersByCustomer(customerId);
  }

  async listAdminOrders(tenantId: string) {
    return this.repository.listOrdersByTenant(tenantId);
  }

  async getOrder(orderId: string): Promise<OrderView> {
    const order = await this.repository.getOrderView(orderId);
    if (!order) throw new NotFoundException("Order not found");
    return order;
  }

  async updateOrderStatus(
    orderId: string,
    status: "PENDING" | "CONFIRMED" | "CANCELLED" | "FULFILLED",
    actorUserId: string | null,
  ) {
    const current = await this.repository.findOrderById(orderId);
    if (!current) throw new NotFoundException("Order not found");
    await this.repository.updateOrderStatus({ orderId, status });
    await this.repository.createStatusHistory({
      orderId,
      fromStatus: current.status,
      toStatus: status,
      actorUserId,
    });
    return this.getOrder(orderId);
  }

  async addOrderNote(orderId: string, authorUserId: string, content: string) {
    const current = await this.repository.findOrderById(orderId);
    if (!current) throw new NotFoundException("Order not found");
    await this.repository.createOrderNote({ orderId, authorUserId, content });
    return this.getOrder(orderId);
  }
}

import { Injectable } from "@nestjs/common";

import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";

import {
  OrderAddressRecord,
  OrderItemRecord,
  OrderNoteRecord,
  OrderRecord,
  OrderStatusHistoryRecord,
  OrderView,
} from "../../domain/entities/order-records";
import { OrderRepository } from "../../domain/repositories/order.repository";

@Injectable()
export class PrismaOrderRepository implements OrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findCheckoutSnapshot(checkoutId: string) {
    const checkout = await this.prisma.checkout
      .findUnique({
        where: { id: checkoutId },
        include: { items: true, addresses: true },
      })
      .catch(() => null);
    if (!checkout) return null;
    return {
      checkout: {
        id: checkout.id,
        tenantId: checkout.tenantId,
        storeId: checkout.storeId,
        customerId: checkout.customerId,
      },
      items: checkout.items.map((item) => ({
        variantId: item.variantId,
        quantity: item.quantity,
        unitAmountSnapshot: item.unitAmountSnapshot,
        currencyCode: item.currencyCode,
      })),
      addresses: checkout.addresses.map((address) => ({
        type: address.type,
        firstName: address.firstName,
        lastName: address.lastName,
        line1: address.line1,
        line2: address.line2,
        city: address.city,
        region: address.region,
        postalCode: address.postalCode,
        countryCode: address.countryCode,
        phone: address.phone,
      })),
    };
  }

  async createOrder(input: {
    tenantId: string;
    storeId: string;
    checkoutId: string;
    customerId?: string | null;
    currencyCode: string;
    subtotalAmount: number;
    discountAmount: number;
    taxAmount: number;
    totalAmount: number;
  }): Promise<OrderRecord> {
    const order = await this.prisma.order.create({ data: input });
    return this.mapOrder(order);
  }

  async createOrderItems(
    orderId: string,
    items: Array<{
      variantId: string;
      quantity: number;
      unitAmountSnapshot: number;
      currencyCode: string;
    }>,
  ): Promise<OrderItemRecord[]> {
    const created = [] as OrderItemRecord[];
    for (const item of items) {
      const createdItem = await this.prisma.orderItem.create({
        data: { orderId, ...item },
      });
      created.push(this.mapItem(createdItem));
    }
    return created;
  }

  async createOrderAddresses(
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
  ): Promise<OrderAddressRecord[]> {
    const created = [] as OrderAddressRecord[];
    for (const address of addresses) {
      const createdAddress = await this.prisma.orderAddress.create({
        data: { orderId, ...address },
      });
      created.push(this.mapAddress(createdAddress));
    }
    return created;
  }

  async createStatusHistory(input: {
    orderId: string;
    fromStatus?: "PENDING" | "CONFIRMED" | "CANCELLED" | "FULFILLED" | null;
    toStatus: "PENDING" | "CONFIRMED" | "CANCELLED" | "FULFILLED";
    actorUserId?: string | null;
  }): Promise<OrderStatusHistoryRecord> {
    const history = await this.prisma.orderStatusHistory.create({
      data: input,
    });
    return this.mapStatusHistory(history);
  }

  async findOrderById(orderId: string): Promise<OrderRecord | null> {
    const order = await this.prisma.order
      .findUnique({ where: { id: orderId } })
      .catch(() => null);
    return order ? this.mapOrder(order) : null;
  }

  async listOrdersByCustomer(customerId: string): Promise<OrderRecord[]> {
    const orders = await this.prisma.order.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
    });
    return orders.map((order) => this.mapOrder(order));
  }

  async listOrdersByTenant(tenantId: string): Promise<OrderRecord[]> {
    const orders = await this.prisma.order.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
    return orders.map((order) => this.mapOrder(order));
  }

  async updateOrderStatus(input: {
    orderId: string;
    status: "PENDING" | "CONFIRMED" | "CANCELLED" | "FULFILLED";
  }): Promise<OrderRecord> {
    const order = await this.prisma.order.update({
      where: { id: input.orderId },
      data: { status: input.status },
    });
    return this.mapOrder(order);
  }

  async createOrderNote(input: {
    orderId: string;
    authorUserId: string;
    content: string;
  }): Promise<OrderNoteRecord> {
    const note = await this.prisma.orderNote.create({ data: input });
    return this.mapNote(note);
  }

  async listOrderItems(orderId: string): Promise<OrderItemRecord[]> {
    const items = await this.prisma.orderItem.findMany({
      where: { orderId },
      orderBy: { createdAt: "asc" },
    });
    return items.map((item) => this.mapItem(item));
  }

  async listOrderAddresses(orderId: string): Promise<OrderAddressRecord[]> {
    const addresses = await this.prisma.orderAddress.findMany({
      where: { orderId },
      orderBy: { createdAt: "asc" },
    });
    return addresses.map((address) => this.mapAddress(address));
  }

  async listOrderStatusHistory(
    orderId: string,
  ): Promise<OrderStatusHistoryRecord[]> {
    const history = await this.prisma.orderStatusHistory.findMany({
      where: { orderId },
      orderBy: { createdAt: "asc" },
    });
    return history.map((item) => this.mapStatusHistory(item));
  }

  async listOrderNotes(orderId: string): Promise<OrderNoteRecord[]> {
    const notes = await this.prisma.orderNote.findMany({
      where: { orderId },
      orderBy: { createdAt: "asc" },
    });
    return notes.map((note) => this.mapNote(note));
  }

  async getOrderView(orderId: string): Promise<OrderView | null> {
    const order = await this.findOrderById(orderId);
    if (!order) return null;
    return {
      order,
      items: await this.listOrderItems(orderId),
      addresses: await this.listOrderAddresses(orderId),
      statusHistory: await this.listOrderStatusHistory(orderId),
      notes: await this.listOrderNotes(orderId),
    };
  }

  private mapOrder(order: {
    id: string;
    tenantId: string;
    storeId: string;
    checkoutId: string;
    customerId: string | null;
    status: "PENDING" | "CONFIRMED" | "CANCELLED" | "FULFILLED";
    currencyCode: string;
    subtotalAmount: number;
    discountAmount: number;
    taxAmount: number;
    totalAmount: number;
  }): OrderRecord {
    return {
      id: order.id,
      tenantId: order.tenantId,
      storeId: order.storeId,
      checkoutId: order.checkoutId,
      customerId: order.customerId,
      status: order.status,
      currencyCode: order.currencyCode,
      subtotalAmount: order.subtotalAmount,
      discountAmount: order.discountAmount,
      taxAmount: order.taxAmount,
      totalAmount: order.totalAmount,
    };
  }

  private mapItem(item: {
    id: string;
    orderId: string;
    variantId: string;
    quantity: number;
    unitAmountSnapshot: number;
    currencyCode: string;
  }): OrderItemRecord {
    return {
      id: item.id,
      orderId: item.orderId,
      variantId: item.variantId,
      quantity: item.quantity,
      unitAmountSnapshot: item.unitAmountSnapshot,
      currencyCode: item.currencyCode,
    };
  }

  private mapAddress(address: {
    id: string;
    orderId: string;
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
  }): OrderAddressRecord {
    return {
      id: address.id,
      orderId: address.orderId,
      type: address.type,
      firstName: address.firstName,
      lastName: address.lastName,
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      region: address.region,
      postalCode: address.postalCode,
      countryCode: address.countryCode,
      phone: address.phone,
    };
  }

  private mapStatusHistory(history: {
    id: string;
    orderId: string;
    fromStatus: "PENDING" | "CONFIRMED" | "CANCELLED" | "FULFILLED" | null;
    toStatus: "PENDING" | "CONFIRMED" | "CANCELLED" | "FULFILLED";
    actorUserId: string | null;
  }): OrderStatusHistoryRecord {
    return {
      id: history.id,
      orderId: history.orderId,
      fromStatus: history.fromStatus,
      toStatus: history.toStatus,
      actorUserId: history.actorUserId,
    };
  }

  private mapNote(note: {
    id: string;
    orderId: string;
    authorUserId: string;
    content: string;
  }): OrderNoteRecord {
    return {
      id: note.id,
      orderId: note.orderId,
      authorUserId: note.authorUserId,
      content: note.content,
    };
  }
}

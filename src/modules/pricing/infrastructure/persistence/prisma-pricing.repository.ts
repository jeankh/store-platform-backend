import { Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";

import {
  CompareAtPriceRecord,
  PriceRecord,
  ScheduledPriceRecord,
} from "../../domain/entities/pricing-records";
import {
  CreateCompareAtPriceInput,
  CreatePriceInput,
  CreateScheduledPriceInput,
  PricingRepository,
  UpdatePriceInput,
} from "../../domain/repositories/pricing.repository";

@Injectable()
export class PrismaPricingRepository implements PricingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createPrice(input: CreatePriceInput): Promise<PriceRecord> {
    const price = await this.prisma.price.create({ data: input });
    return this.mapPrice(price);
  }

  async findPriceByVariantAndCurrency(
    variantId: string,
    currencyCode: string,
  ): Promise<PriceRecord | null> {
    const price = await this.prisma.price.findUnique({
      where: { variantId_currencyCode: { variantId, currencyCode } },
    });
    return price ? this.mapPrice(price) : null;
  }

  async listPricesByVariant(variantId: string): Promise<PriceRecord[]> {
    const prices = await this.prisma.price.findMany({
      where: { variantId },
      orderBy: { currencyCode: "asc" },
    });
    return prices.map((price) => this.mapPrice(price));
  }

  async updatePrice(input: UpdatePriceInput): Promise<PriceRecord> {
    const price = await this.prisma.price
      .update({ where: { id: input.priceId }, data: { amount: input.amount } })
      .catch(() => {
        throw new NotFoundException("Price not found");
      });
    return this.mapPrice(price);
  }

  async createCompareAtPrice(
    input: CreateCompareAtPriceInput,
  ): Promise<CompareAtPriceRecord> {
    const price = await this.prisma.compareAtPrice.create({ data: input });
    return this.mapCompareAtPrice(price);
  }

  async findCompareAtPriceByVariantAndCurrency(
    variantId: string,
    currencyCode: string,
  ): Promise<CompareAtPriceRecord | null> {
    const price = await this.prisma.compareAtPrice.findUnique({
      where: { variantId_currencyCode: { variantId, currencyCode } },
    });
    return price ? this.mapCompareAtPrice(price) : null;
  }

  async createScheduledPrice(
    input: CreateScheduledPriceInput,
  ): Promise<ScheduledPriceRecord> {
    const price = await this.prisma.scheduledPrice.create({ data: input });
    return this.mapScheduledPrice(price);
  }

  async listScheduledPricesByVariant(
    variantId: string,
  ): Promise<ScheduledPriceRecord[]> {
    const prices = await this.prisma.scheduledPrice.findMany({
      where: { variantId },
      orderBy: { startsAt: "asc" },
    });
    return prices.map((price) => this.mapScheduledPrice(price));
  }

  async findVariantById(variantId: string) {
    return this.prisma.productVariant
      .findUnique({
        where: { id: variantId },
        include: { product: { select: { tenantId: true, storeId: true } } },
      })
      .catch(() => null);
  }

  private mapPrice(price: {
    id: string;
    tenantId: string;
    storeId: string;
    variantId: string;
    currencyCode: string;
    amount: number;
  }): PriceRecord {
    return {
      id: price.id,
      tenantId: price.tenantId,
      storeId: price.storeId,
      variantId: price.variantId,
      currencyCode: price.currencyCode,
      amount: price.amount,
    };
  }

  private mapCompareAtPrice(price: {
    id: string;
    tenantId: string;
    storeId: string;
    variantId: string;
    currencyCode: string;
    amount: number;
  }): CompareAtPriceRecord {
    return {
      id: price.id,
      tenantId: price.tenantId,
      storeId: price.storeId,
      variantId: price.variantId,
      currencyCode: price.currencyCode,
      amount: price.amount,
    };
  }

  private mapScheduledPrice(price: {
    id: string;
    tenantId: string;
    storeId: string;
    variantId: string;
    currencyCode: string;
    amount: number;
    startsAt: Date;
    endsAt: Date | null;
  }): ScheduledPriceRecord {
    return {
      id: price.id,
      tenantId: price.tenantId,
      storeId: price.storeId,
      variantId: price.variantId,
      currencyCode: price.currencyCode,
      amount: price.amount,
      startsAt: price.startsAt,
      endsAt: price.endsAt,
    };
  }
}

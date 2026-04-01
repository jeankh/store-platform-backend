import { describe, expect, it } from "vitest";

import { AuditService } from "src/modules/audit/application/services/audit.service";
import { PricingService } from "src/modules/pricing/application/services/pricing.service";
import {
  CompareAtPriceRecord,
  PriceRecord,
  ScheduledPriceRecord,
} from "src/modules/pricing/domain/entities/pricing-records";
import { PricingRepository } from "src/modules/pricing/domain/repositories/pricing.repository";

class InMemoryPricingRepository implements PricingRepository {
  prices = new Map<string, PriceRecord>();
  compareAtPrices = new Map<string, CompareAtPriceRecord>();
  scheduledPrices = new Map<string, ScheduledPriceRecord>();
  variant = {
    id: "variant-1",
    productId: "product-1",
    product: { tenantId: "tenant-1", storeId: "store-1" },
  };

  async createPrice(input: any) {
    const price = {
      id: `price-${this.prices.size + 1}`,
      ...input,
    } as PriceRecord;
    this.prices.set(price.id, price);
    return price;
  }
  async findPriceByVariantAndCurrency(variantId: string, currencyCode: string) {
    return (
      Array.from(this.prices.values()).find(
        (price) =>
          price.variantId === variantId && price.currencyCode === currencyCode,
      ) || null
    );
  }
  async listPricesByVariant(variantId: string) {
    return Array.from(this.prices.values()).filter(
      (price) => price.variantId === variantId,
    );
  }
  async updatePrice(input: any) {
    const price = this.prices.get(input.priceId)!;
    const next = { ...price, amount: input.amount };
    this.prices.set(input.priceId, next);
    return next;
  }
  async createCompareAtPrice(input: any) {
    const price = {
      id: `compare-${this.compareAtPrices.size + 1}`,
      ...input,
    } as CompareAtPriceRecord;
    this.compareAtPrices.set(price.id, price);
    return price;
  }
  async findCompareAtPriceByVariantAndCurrency(
    variantId: string,
    currencyCode: string,
  ) {
    return (
      Array.from(this.compareAtPrices.values()).find(
        (price) =>
          price.variantId === variantId && price.currencyCode === currencyCode,
      ) || null
    );
  }
  async createScheduledPrice(input: any) {
    const price = {
      id: `scheduled-${this.scheduledPrices.size + 1}`,
      endsAt: null,
      ...input,
    } as ScheduledPriceRecord;
    this.scheduledPrices.set(price.id, price);
    return price;
  }
  async listScheduledPricesByVariant(variantId: string) {
    return Array.from(this.scheduledPrices.values()).filter(
      (price) => price.variantId === variantId,
    );
  }
  async findVariantById(variantId: string) {
    return variantId === this.variant.id ? this.variant : null;
  }
}

class AuditServiceStub {
  async record() {
    return;
  }
}

describe("Pricing unit tests", () => {
  it("creates base price for variant and currency", async () => {
    const service = new PricingService(
      new InMemoryPricingRepository(),
      new AuditServiceStub() as unknown as AuditService,
    );
    const price = await service.createBasePrice(
      "user-1",
      "tenant-1",
      "variant-1",
      { currencyCode: "USD", amount: 1000 },
    );
    expect(price.amount).toBe(1000);
  });
  it("rejects duplicate active base price for same variant and currency", async () => {
    const repo = new InMemoryPricingRepository();
    const service = new PricingService(
      repo,
      new AuditServiceStub() as unknown as AuditService,
    );
    await service.createBasePrice("user-1", "tenant-1", "variant-1", {
      currencyCode: "USD",
      amount: 1000,
    });
    await expect(
      service.createBasePrice("user-1", "tenant-1", "variant-1", {
        currencyCode: "USD",
        amount: 2000,
      }),
    ).rejects.toThrow("Base price already exists for variant and currency");
  });
  it("creates compare-at price", async () => {
    const service = new PricingService(
      new InMemoryPricingRepository(),
      new AuditServiceStub() as unknown as AuditService,
    );
    const price = await service.createCompareAtPrice(
      "user-1",
      "tenant-1",
      "variant-1",
      { currencyCode: "USD", amount: 1500 },
    );
    expect(price.amount).toBe(1500);
  });
  it("creates scheduled sale price with valid range", async () => {
    const service = new PricingService(
      new InMemoryPricingRepository(),
      new AuditServiceStub() as unknown as AuditService,
    );
    const startsAt = new Date(Date.now() + 1000);
    const endsAt = new Date(Date.now() + 2000);
    const price = await service.createScheduledPrice(
      "user-1",
      "tenant-1",
      "variant-1",
      { currencyCode: "USD", amount: 900, startsAt, endsAt },
    );
    expect(price.amount).toBe(900);
  });
  it("rejects invalid scheduled price range", async () => {
    const service = new PricingService(
      new InMemoryPricingRepository(),
      new AuditServiceStub() as unknown as AuditService,
    );
    const startsAt = new Date(Date.now() + 2000);
    const endsAt = new Date(Date.now() + 1000);
    await expect(
      service.createScheduledPrice("user-1", "tenant-1", "variant-1", {
        currencyCode: "USD",
        amount: 900,
        startsAt,
        endsAt,
      }),
    ).rejects.toThrow("Scheduled price end must be after start");
  });
});

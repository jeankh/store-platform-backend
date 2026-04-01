import { describe, expect, it } from "vitest";

import { AuditService } from "src/modules/audit/application/services/audit.service";
import { PromotionService } from "src/modules/promotion/application/services/promotion.service";
import {
  CouponRecord,
  PromotionRuleRecord,
  PromotionUsageRecord,
} from "src/modules/promotion/domain/entities/promotion-records";
import { PromotionRepository } from "src/modules/promotion/domain/repositories/promotion.repository";

class InMemoryPromotionRepository implements PromotionRepository {
  coupons = new Map<string, CouponRecord>();
  async createCoupon(input: any) {
    const coupon = {
      id: `coupon-${this.coupons.size + 1}`,
      status: "ACTIVE",
      startsAt: null,
      endsAt: null,
      usageLimit: null,
      ...input,
    } as CouponRecord;
    this.coupons.set(coupon.id, coupon);
    return coupon;
  }
  async listCoupons(tenantId: string) {
    return Array.from(this.coupons.values()).filter(
      (coupon) => coupon.tenantId === tenantId,
    );
  }
  async findCouponById(couponId: string) {
    return this.coupons.get(couponId) || null;
  }
  async findCouponByStoreAndCode(storeId: string, code: string) {
    return (
      Array.from(this.coupons.values()).find(
        (coupon) => coupon.storeId === storeId && coupon.code === code,
      ) || null
    );
  }
  async updateCoupon(input: any) {
    const coupon = this.coupons.get(input.couponId)!;
    const next = { ...coupon, ...input };
    this.coupons.set(input.couponId, next);
    return next;
  }
  async createPromotionRule(input: any) {
    return { id: "rule-1", ...input } as PromotionRuleRecord;
  }
  async createPromotionUsage(input: any) {
    return {
      id: "usage-1",
      usedAt: new Date(),
      customerId: null,
      orderId: null,
      ...input,
    } as PromotionUsageRecord;
  }
}

class AuditServiceStub {
  async record() {
    return;
  }
}

describe("Promotion coupons unit tests", () => {
  it("creates coupon with valid code and usage limit", async () => {
    const service = new PromotionService(
      new InMemoryPromotionRepository(),
      new AuditServiceStub() as unknown as AuditService,
    );
    const coupon = await service.createCoupon("user-1", "tenant-1", {
      tenantId: "tenant-1",
      storeId: "store-1",
      code: "SAVE10",
      type: "FIXED",
      value: 1000,
      usageLimit: 10,
    });
    expect(coupon.code).toBe("SAVE10");
  });
  it("rejects duplicate coupon code within store", async () => {
    const service = new PromotionService(
      new InMemoryPromotionRepository(),
      new AuditServiceStub() as unknown as AuditService,
    );
    await service.createCoupon("user-1", "tenant-1", {
      tenantId: "tenant-1",
      storeId: "store-1",
      code: "SAVE10",
      type: "FIXED",
      value: 1000,
    });
    await expect(
      service.createCoupon("user-1", "tenant-1", {
        tenantId: "tenant-1",
        storeId: "store-1",
        code: "save10",
        type: "FIXED",
        value: 1000,
      }),
    ).rejects.toThrow("Coupon code already exists for store");
  });
  it("updates coupon status correctly", async () => {
    const service = new PromotionService(
      new InMemoryPromotionRepository(),
      new AuditServiceStub() as unknown as AuditService,
    );
    const coupon = await service.createCoupon("user-1", "tenant-1", {
      tenantId: "tenant-1",
      storeId: "store-1",
      code: "SAVE10",
      type: "FIXED",
      value: 1000,
    });
    const updated = await service.updateCoupon(
      "user-1",
      "tenant-1",
      coupon.id,
      { status: "INACTIVE" },
    );
    expect(updated.status).toBe("INACTIVE");
  });
});

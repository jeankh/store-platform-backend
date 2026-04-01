import {
  CouponRecord,
  PromotionRuleRecord,
  PromotionUsageRecord,
} from "../entities/promotion-records";

export type CreateCouponInput = {
  tenantId: string;
  storeId: string;
  code: string;
  type: "FIXED" | "PERCENTAGE";
  value: number;
  status?: "ACTIVE" | "INACTIVE";
  startsAt?: Date | null;
  endsAt?: Date | null;
  usageLimit?: number | null;
};

export type UpdateCouponInput = {
  couponId: string;
  value?: number;
  status?: "ACTIVE" | "INACTIVE";
  startsAt?: Date | null;
  endsAt?: Date | null;
  usageLimit?: number | null;
};

export type CreatePromotionRuleInput = {
  tenantId: string;
  storeId: string;
  couponId?: string | null;
  resource: string;
  operator: string;
  value: string;
};

export type CreatePromotionUsageInput = {
  tenantId: string;
  storeId: string;
  couponId: string;
  customerId?: string | null;
  orderId?: string | null;
};

export interface PromotionRepository {
  createCoupon(input: CreateCouponInput): Promise<CouponRecord>;
  listCoupons(tenantId: string): Promise<CouponRecord[]>;
  findCouponById(couponId: string): Promise<CouponRecord | null>;
  findCouponByStoreAndCode(
    storeId: string,
    code: string,
  ): Promise<CouponRecord | null>;
  updateCoupon(input: UpdateCouponInput): Promise<CouponRecord>;
  createPromotionRule(
    input: CreatePromotionRuleInput,
  ): Promise<PromotionRuleRecord>;
  createPromotionUsage(
    input: CreatePromotionUsageInput,
  ): Promise<PromotionUsageRecord>;
}

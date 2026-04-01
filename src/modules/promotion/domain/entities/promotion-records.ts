export type CouponRecord = {
  id: string;
  tenantId: string;
  storeId: string;
  code: string;
  type: "FIXED" | "PERCENTAGE";
  value: number;
  status: "ACTIVE" | "INACTIVE";
  startsAt: Date | null;
  endsAt: Date | null;
  usageLimit: number | null;
};

export type PromotionRuleRecord = {
  id: string;
  tenantId: string;
  storeId: string;
  couponId: string | null;
  resource: string;
  operator: string;
  value: string;
};

export type PromotionUsageRecord = {
  id: string;
  tenantId: string;
  storeId: string;
  couponId: string;
  customerId: string | null;
  orderId: string | null;
  usedAt: Date;
};

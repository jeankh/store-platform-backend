import { Injectable, NotFoundException } from "@nestjs/common";
import { CouponStatus, CouponType } from "@prisma/client";

import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";

import {
  CouponRecord,
  PromotionRuleRecord,
  PromotionUsageRecord,
} from "../../domain/entities/promotion-records";
import {
  CreateCouponInput,
  CreatePromotionRuleInput,
  CreatePromotionUsageInput,
  PromotionRepository,
  UpdateCouponInput,
} from "../../domain/repositories/promotion.repository";

@Injectable()
export class PrismaPromotionRepository implements PromotionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createCoupon(input: CreateCouponInput): Promise<CouponRecord> {
    const coupon = await this.prisma.coupon.create({
      data: {
        tenantId: input.tenantId,
        storeId: input.storeId,
        code: input.code,
        type: input.type as CouponType,
        value: input.value,
        status: (input.status || "ACTIVE") as CouponStatus,
        startsAt: input.startsAt || null,
        endsAt: input.endsAt || null,
        usageLimit: input.usageLimit || null,
      },
    });
    return this.mapCoupon(coupon);
  }

  async listCoupons(tenantId: string): Promise<CouponRecord[]> {
    const coupons = await this.prisma.coupon.findMany({
      where: { tenantId },
      orderBy: { createdAt: "asc" },
    });
    return coupons.map((coupon) => this.mapCoupon(coupon));
  }

  async findCouponById(couponId: string): Promise<CouponRecord | null> {
    const coupon = await this.prisma.coupon
      .findUnique({ where: { id: couponId } })
      .catch(() => null);
    return coupon ? this.mapCoupon(coupon) : null;
  }

  async findCouponByStoreAndCode(
    storeId: string,
    code: string,
  ): Promise<CouponRecord | null> {
    const coupon = await this.prisma.coupon.findUnique({
      where: { storeId_code: { storeId, code } },
    });
    return coupon ? this.mapCoupon(coupon) : null;
  }

  async updateCoupon(input: UpdateCouponInput): Promise<CouponRecord> {
    const coupon = await this.prisma.coupon
      .update({
        where: { id: input.couponId },
        data: {
          value: input.value,
          status: input.status as CouponStatus | undefined,
          startsAt: input.startsAt,
          endsAt: input.endsAt,
          usageLimit: input.usageLimit,
        },
      })
      .catch(() => {
        throw new NotFoundException("Coupon not found");
      });
    return this.mapCoupon(coupon);
  }

  async createPromotionRule(
    input: CreatePromotionRuleInput,
  ): Promise<PromotionRuleRecord> {
    const rule = await this.prisma.promotionRule.create({ data: input });
    return {
      id: rule.id,
      tenantId: rule.tenantId,
      storeId: rule.storeId,
      couponId: rule.couponId,
      resource: rule.resource,
      operator: rule.operator,
      value: rule.value,
    };
  }

  async createPromotionUsage(
    input: CreatePromotionUsageInput,
  ): Promise<PromotionUsageRecord> {
    const usage = await this.prisma.promotionUsage.create({
      data: {
        tenantId: input.tenantId,
        storeId: input.storeId,
        couponId: input.couponId,
        customerId: input.customerId || null,
        orderId: input.orderId || null,
      },
    });
    return {
      id: usage.id,
      tenantId: usage.tenantId,
      storeId: usage.storeId,
      couponId: usage.couponId,
      customerId: usage.customerId,
      orderId: usage.orderId,
      usedAt: usage.usedAt,
    };
  }

  private mapCoupon(coupon: {
    id: string;
    tenantId: string;
    storeId: string;
    code: string;
    type: CouponType;
    value: number;
    status: CouponStatus;
    startsAt: Date | null;
    endsAt: Date | null;
    usageLimit: number | null;
  }): CouponRecord {
    return {
      id: coupon.id,
      tenantId: coupon.tenantId,
      storeId: coupon.storeId,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      status: coupon.status,
      startsAt: coupon.startsAt,
      endsAt: coupon.endsAt,
      usageLimit: coupon.usageLimit,
    };
  }
}

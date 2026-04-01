import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { AuditService } from "src/modules/audit/application/services/audit.service";

import { CouponRecord } from "../../domain/entities/promotion-records";
import { PromotionRepository } from "../../domain/repositories/promotion.repository";
import { PROMOTION_REPOSITORY } from "../../domain/repositories/promotion.repository.token";

@Injectable()
export class PromotionService {
  constructor(
    @Inject(PROMOTION_REPOSITORY)
    private readonly repository: PromotionRepository,
    @Inject(AuditService) private readonly auditService: AuditService,
  ) {}

  async createCoupon(
    actorUserId: string,
    actorTenantId: string,
    input: {
      tenantId: string;
      storeId: string;
      code: string;
      type: "FIXED" | "PERCENTAGE";
      value: number;
      status?: "ACTIVE" | "INACTIVE";
      startsAt?: Date | null;
      endsAt?: Date | null;
      usageLimit?: number | null;
    },
  ): Promise<CouponRecord> {
    this.ensureTenantAccess(actorTenantId, input.tenantId);
    const normalizedCode = input.code.trim().toUpperCase();
    const existingCoupon = await this.repository.findCouponByStoreAndCode(
      input.storeId,
      normalizedCode,
    );
    if (existingCoupon)
      throw new ConflictException("Coupon code already exists for store");
    const coupon = await this.repository.createCoupon({
      ...input,
      code: normalizedCode,
    });
    await this.auditService.record({
      tenantId: input.tenantId,
      actorUserId,
      action: "promotion.coupon.created",
      entityType: "coupon",
      entityId: coupon.id,
      metadata: { code: coupon.code },
    });
    return coupon;
  }

  listCoupons(actorTenantId: string) {
    return this.repository.listCoupons(actorTenantId);
  }

  async updateCoupon(
    actorUserId: string,
    actorTenantId: string,
    couponId: string,
    input: {
      value?: number;
      status?: "ACTIVE" | "INACTIVE";
      startsAt?: Date | null;
      endsAt?: Date | null;
      usageLimit?: number | null;
    },
  ) {
    const coupon = await this.repository.findCouponById(couponId);
    if (!coupon) throw new NotFoundException("Coupon not found");
    this.ensureTenantAccess(actorTenantId, coupon.tenantId);
    const updated = await this.repository.updateCoupon({ couponId, ...input });
    await this.auditService.record({
      tenantId: updated.tenantId,
      actorUserId,
      action: "promotion.coupon.updated",
      entityType: "coupon",
      entityId: updated.id,
      metadata: { status: updated.status },
    });
    return updated;
  }

  private ensureTenantAccess(actorTenantId: string, targetTenantId: string) {
    if (actorTenantId !== targetTenantId)
      throw new ForbiddenException("Cross-tenant access is not allowed");
  }
}

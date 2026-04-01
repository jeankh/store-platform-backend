import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";

import { PermissionGuard } from "src/modules/access-control/presentation/admin/permission.guard";
import { RequirePermission } from "src/modules/access-control/presentation/admin/require-permission.decorator";
import { AccessTokenGuard } from "src/modules/identity/presentation/admin/access-token.guard";
import { AuthUser } from "src/modules/identity/presentation/admin/auth-user.decorator";
import { AuthenticatedUser } from "src/modules/identity/presentation/admin/authenticated-user.interface";

import { PromotionService } from "../../../application/services/promotion.service";
import { CreateCouponDto } from "../dto/create-coupon.dto";
import { UpdateCouponDto } from "../dto/update-coupon.dto";

@Controller("admin/coupons")
@UseGuards(AccessTokenGuard, PermissionGuard)
export class AdminCouponsController {
  constructor(
    @Inject(PromotionService)
    private readonly promotionService: PromotionService,
  ) {}

  @Post()
  @RequirePermission("promotion.update")
  createCoupon(
    @AuthUser() user: AuthenticatedUser,
    @Body() body: CreateCouponDto,
  ) {
    return this.promotionService.createCoupon(user.userId, user.tenantId, {
      ...body,
      startsAt: body.startsAt ? new Date(body.startsAt) : null,
      endsAt: body.endsAt ? new Date(body.endsAt) : null,
    });
  }

  @Get()
  @RequirePermission("promotion.read")
  listCoupons(@AuthUser() user: AuthenticatedUser) {
    return this.promotionService.listCoupons(user.tenantId);
  }

  @Patch(":couponId")
  @RequirePermission("promotion.update")
  updateCoupon(
    @AuthUser() user: AuthenticatedUser,
    @Param("couponId", new ParseUUIDPipe()) couponId: string,
    @Body() body: UpdateCouponDto,
  ) {
    return this.promotionService.updateCoupon(
      user.userId,
      user.tenantId,
      couponId,
      {
        ...body,
        startsAt: body.startsAt ? new Date(body.startsAt) : undefined,
        endsAt: body.endsAt ? new Date(body.endsAt) : undefined,
      },
    );
  }
}

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

import { PricingService } from "../../../application/services/pricing.service";
import { CreateVariantPriceDto } from "../dto/create-variant-price.dto";
import { UpdatePriceDto } from "../dto/update-price.dto";

@Controller("admin")
@UseGuards(AccessTokenGuard, PermissionGuard)
export class AdminPricingController {
  constructor(
    @Inject(PricingService) private readonly pricingService: PricingService,
  ) {}

  @Post("variants/:variantId/prices")
  @RequirePermission("pricing.update")
  createBasePrice(
    @AuthUser() user: AuthenticatedUser,
    @Param("variantId", new ParseUUIDPipe()) variantId: string,
    @Body() body: CreateVariantPriceDto,
  ) {
    return this.pricingService.createBasePrice(
      user.userId,
      user.tenantId,
      variantId,
      body,
    );
  }

  @Get("variants/:variantId/prices")
  @RequirePermission("pricing.read")
  listVariantPrices(
    @AuthUser() user: AuthenticatedUser,
    @Param("variantId", new ParseUUIDPipe()) variantId: string,
  ) {
    return this.pricingService.listVariantPrices(user.tenantId, variantId);
  }

  @Patch("prices/:priceId")
  @RequirePermission("pricing.update")
  updatePrice(
    @AuthUser() user: AuthenticatedUser,
    @Param("priceId", new ParseUUIDPipe()) priceId: string,
    @Body() body: UpdatePriceDto,
  ) {
    return this.pricingService.updatePrice(
      user.userId,
      user.tenantId,
      priceId,
      body.amount,
    );
  }
}

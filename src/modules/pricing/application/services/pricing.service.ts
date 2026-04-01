import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { AuditService } from "src/modules/audit/application/services/audit.service";

import {
  CompareAtPriceRecord,
  PriceRecord,
  ScheduledPriceRecord,
} from "../../domain/entities/pricing-records";
import { PricingRepository } from "../../domain/repositories/pricing.repository";
import { PRICING_REPOSITORY } from "../../domain/repositories/pricing.repository.token";

@Injectable()
export class PricingService {
  constructor(
    @Inject(PRICING_REPOSITORY) private readonly repository: PricingRepository,
    @Inject(AuditService) private readonly auditService: AuditService,
  ) {}

  async createBasePrice(
    actorUserId: string,
    actorTenantId: string,
    variantId: string,
    input: { currencyCode: string; amount: number },
  ): Promise<PriceRecord> {
    const variant = await this.repository.findVariantById(variantId);
    if (!variant) throw new NotFoundException("Variant not found");
    this.ensureTenantAccess(actorTenantId, variant.product.tenantId);
    const existingPrice = await this.repository.findPriceByVariantAndCurrency(
      variantId,
      input.currencyCode,
    );
    if (existingPrice)
      throw new ConflictException(
        "Base price already exists for variant and currency",
      );
    const price = await this.repository.createPrice({
      tenantId: variant.product.tenantId,
      storeId: variant.product.storeId,
      variantId,
      currencyCode: input.currencyCode,
      amount: input.amount,
    });
    await this.auditService.record({
      tenantId: price.tenantId,
      actorUserId,
      action: "pricing.base_price.created",
      entityType: "price",
      entityId: price.id,
      metadata: { variantId, currencyCode: price.currencyCode },
    });
    return price;
  }

  async createCompareAtPrice(
    actorUserId: string,
    actorTenantId: string,
    variantId: string,
    input: { currencyCode: string; amount: number },
  ): Promise<CompareAtPriceRecord> {
    const variant = await this.repository.findVariantById(variantId);
    if (!variant) throw new NotFoundException("Variant not found");
    this.ensureTenantAccess(actorTenantId, variant.product.tenantId);
    const existing =
      await this.repository.findCompareAtPriceByVariantAndCurrency(
        variantId,
        input.currencyCode,
      );
    if (existing)
      throw new ConflictException(
        "Compare-at price already exists for variant and currency",
      );
    return this.repository.createCompareAtPrice({
      tenantId: variant.product.tenantId,
      storeId: variant.product.storeId,
      variantId,
      currencyCode: input.currencyCode,
      amount: input.amount,
    });
  }

  async createScheduledPrice(
    actorUserId: string,
    actorTenantId: string,
    variantId: string,
    input: {
      currencyCode: string;
      amount: number;
      startsAt: Date;
      endsAt?: Date | null;
    },
  ): Promise<ScheduledPriceRecord> {
    const variant = await this.repository.findVariantById(variantId);
    if (!variant) throw new NotFoundException("Variant not found");
    this.ensureTenantAccess(actorTenantId, variant.product.tenantId);
    if (input.endsAt && input.endsAt <= input.startsAt)
      throw new ConflictException("Scheduled price end must be after start");
    return this.repository.createScheduledPrice({
      tenantId: variant.product.tenantId,
      storeId: variant.product.storeId,
      variantId,
      currencyCode: input.currencyCode,
      amount: input.amount,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
    });
  }

  async listVariantPrices(actorTenantId: string, variantId: string) {
    const variant = await this.repository.findVariantById(variantId);
    if (!variant) throw new NotFoundException("Variant not found");
    this.ensureTenantAccess(actorTenantId, variant.product.tenantId);
    return this.repository.listPricesByVariant(variantId);
  }

  async updatePrice(
    actorUserId: string,
    actorTenantId: string,
    priceId: string,
    amount: number,
  ) {
    return this.repository.updatePrice({ priceId, amount });
  }

  private ensureTenantAccess(actorTenantId: string, targetTenantId: string) {
    if (actorTenantId !== targetTenantId)
      throw new ForbiddenException("Cross-tenant access is not allowed");
  }
}

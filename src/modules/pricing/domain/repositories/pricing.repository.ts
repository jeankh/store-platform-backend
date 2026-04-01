import {
  CompareAtPriceRecord,
  PriceRecord,
  ScheduledPriceRecord,
} from "../entities/pricing-records";

export type CreatePriceInput = {
  tenantId: string;
  storeId: string;
  variantId: string;
  currencyCode: string;
  amount: number;
};

export type CreateCompareAtPriceInput = CreatePriceInput;

export type CreateScheduledPriceInput = CreatePriceInput & {
  startsAt: Date;
  endsAt?: Date | null;
};

export type UpdatePriceInput = {
  priceId: string;
  amount?: number;
};

export interface PricingRepository {
  createPrice(input: CreatePriceInput): Promise<PriceRecord>;
  findPriceByVariantAndCurrency(
    variantId: string,
    currencyCode: string,
  ): Promise<PriceRecord | null>;
  listPricesByVariant(variantId: string): Promise<PriceRecord[]>;
  updatePrice(input: UpdatePriceInput): Promise<PriceRecord>;

  createCompareAtPrice(
    input: CreateCompareAtPriceInput,
  ): Promise<CompareAtPriceRecord>;
  findCompareAtPriceByVariantAndCurrency(
    variantId: string,
    currencyCode: string,
  ): Promise<CompareAtPriceRecord | null>;

  createScheduledPrice(
    input: CreateScheduledPriceInput,
  ): Promise<ScheduledPriceRecord>;
  listScheduledPricesByVariant(
    variantId: string,
  ): Promise<ScheduledPriceRecord[]>;

  findVariantById(
    variantId: string,
  ): Promise<{
    id: string;
    productId: string;
    product: { tenantId: string; storeId: string };
  } | null>;
}

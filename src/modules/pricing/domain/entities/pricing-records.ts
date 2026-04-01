export type PriceRecord = {
  id: string;
  tenantId: string;
  storeId: string;
  variantId: string;
  currencyCode: string;
  amount: number;
};

export type CompareAtPriceRecord = {
  id: string;
  tenantId: string;
  storeId: string;
  variantId: string;
  currencyCode: string;
  amount: number;
};

export type ScheduledPriceRecord = {
  id: string;
  tenantId: string;
  storeId: string;
  variantId: string;
  currencyCode: string;
  amount: number;
  startsAt: Date;
  endsAt: Date | null;
};

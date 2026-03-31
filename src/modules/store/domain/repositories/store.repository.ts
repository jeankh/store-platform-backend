import { StoreView } from "../entities/store-record";

export type CreateStoreInput = {
  tenantId: string;
  slug: string;
  name: string;
  defaultLocale: string;
  defaultCurrency: string;
};

export type UpdateStoreInput = {
  storeId: string;
  slug?: string;
  name?: string;
  status?: "ACTIVE" | "INACTIVE";
  defaultLocale?: string;
  defaultCurrency?: string;
};

export interface StoreRepository {
  create(input: CreateStoreInput): Promise<StoreView>;
  listByTenant(tenantId: string): Promise<StoreView[]>;
  findById(storeId: string): Promise<StoreView | null>;
  findByTenantAndSlug(
    tenantId: string,
    slug: string,
  ): Promise<StoreView | null>;
  update(input: UpdateStoreInput): Promise<StoreView>;
}

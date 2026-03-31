import { TenantView } from "../entities/tenant-record";

export type CreateTenantInput = {
  slug: string;
  name: string;
  defaultLocale: string;
  defaultCurrency: string;
};

export type UpdateTenantInput = {
  tenantId: string;
  slug?: string;
  name?: string;
  status?: "ACTIVE" | "INACTIVE";
  defaultLocale?: string;
  defaultCurrency?: string;
};

export interface TenantRepository {
  create(input: CreateTenantInput): Promise<TenantView>;
  list(): Promise<TenantView[]>;
  findById(tenantId: string): Promise<TenantView | null>;
  findBySlug(slug: string): Promise<TenantView | null>;
  update(input: UpdateTenantInput): Promise<TenantView>;
}

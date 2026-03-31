import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { AuditService } from "src/modules/audit/application/services/audit.service";
import { TenantService } from "src/modules/tenant/application/services/tenant.service";

import { StoreView } from "../../domain/entities/store-record";
import { StoreRepository } from "../../domain/repositories/store.repository";
import { STORE_REPOSITORY } from "../../domain/repositories/store.repository.token";

@Injectable()
export class StoreService {
  constructor(
    @Inject(STORE_REPOSITORY) private readonly repository: StoreRepository,
    private readonly tenantService: TenantService,
    private readonly auditService: AuditService,
  ) {}

  async create(
    actorUserId: string,
    actorTenantId: string,
    tenantId: string,
    input: {
      slug: string;
      name: string;
      defaultLocale?: string;
      defaultCurrency?: string;
    },
  ): Promise<StoreView> {
    this.ensureTenantAccess(actorTenantId, tenantId);
    await this.tenantService.getById(tenantId);

    const normalizedSlug = this.normalizeSlug(input.slug);
    const existingStore = await this.repository.findByTenantAndSlug(
      tenantId,
      normalizedSlug,
    );

    if (existingStore) {
      throw new ConflictException("Store slug already exists for tenant");
    }

    const store = await this.repository.create({
      tenantId,
      slug: normalizedSlug,
      name: input.name,
      defaultLocale: input.defaultLocale || "en",
      defaultCurrency: input.defaultCurrency || "USD",
    });

    await this.auditService.record({
      tenantId,
      actorUserId,
      action: "store.created",
      entityType: "store",
      entityId: store.id,
      metadata: { slug: store.slug },
    });

    return store;
  }

  listByTenant(actorTenantId: string, tenantId: string) {
    this.ensureTenantAccess(actorTenantId, tenantId);
    return this.repository.listByTenant(tenantId);
  }

  async getById(actorTenantId: string, storeId: string) {
    const store = await this.repository.findById(storeId);

    if (!store) {
      throw new NotFoundException("Store not found");
    }

    this.ensureTenantAccess(actorTenantId, store.tenantId);

    return store;
  }

  async update(
    actorUserId: string,
    actorTenantId: string,
    storeId: string,
    input: {
      slug?: string;
      name?: string;
      status?: "ACTIVE" | "INACTIVE";
      defaultLocale?: string;
      defaultCurrency?: string;
    },
  ) {
    const currentStore = await this.getById(actorTenantId, storeId);

    if (input.slug) {
      const normalizedSlug = this.normalizeSlug(input.slug);
      const existingStore = await this.repository.findByTenantAndSlug(
        currentStore.tenantId,
        normalizedSlug,
      );

      if (existingStore && existingStore.id !== storeId) {
        throw new ConflictException("Store slug already exists for tenant");
      }

      input.slug = normalizedSlug;
    }

    const store = await this.repository.update({ storeId, ...input });

    await this.auditService.record({
      tenantId: store.tenantId,
      actorUserId,
      action: "store.updated",
      entityType: "store",
      entityId: store.id,
      metadata: { status: store.status },
    });

    return store;
  }

  ensureTenantAccess(actorTenantId: string, targetTenantId: string) {
    if (actorTenantId !== targetTenantId) {
      throw new ForbiddenException("Cross-tenant access is not allowed");
    }
  }

  normalizeSlug(slug: string) {
    return slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
}

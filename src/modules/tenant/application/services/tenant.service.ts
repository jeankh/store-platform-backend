import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { AuditService } from "src/modules/audit/application/services/audit.service";

import { TenantView } from "../../domain/entities/tenant-record";
import { TenantRepository } from "../../domain/repositories/tenant.repository";
import { TENANT_REPOSITORY } from "../../domain/repositories/tenant.repository.token";

@Injectable()
export class TenantService {
  constructor(
    @Inject(TENANT_REPOSITORY) private readonly repository: TenantRepository,
    @Inject(AuditService)
    private readonly auditService: AuditService,
  ) {}

  async create(
    actorUserId: string | null,
    input: {
      slug: string;
      name: string;
      defaultLocale?: string;
      defaultCurrency?: string;
    },
  ): Promise<TenantView> {
    const normalizedSlug = this.normalizeSlug(input.slug);
    const existingTenant = await this.repository.findBySlug(normalizedSlug);

    if (existingTenant) {
      throw new ConflictException("Tenant slug already exists");
    }

    const tenant = await this.repository.create({
      slug: normalizedSlug,
      name: input.name,
      defaultLocale: input.defaultLocale || "en",
      defaultCurrency: input.defaultCurrency || "USD",
    });

    await this.auditService.record({
      tenantId: tenant.id,
      actorUserId,
      action: "tenant.created",
      entityType: "tenant",
      entityId: tenant.id,
      metadata: { slug: tenant.slug },
    });

    return tenant;
  }

  list() {
    return this.repository.list();
  }

  async getById(tenantId: string) {
    const tenant = await this.repository.findById(tenantId);

    if (!tenant) {
      throw new NotFoundException("Tenant not found");
    }

    return tenant;
  }

  async update(
    actorUserId: string,
    actorTenantId: string,
    tenantId: string,
    input: {
      slug?: string;
      name?: string;
      status?: "ACTIVE" | "INACTIVE";
      defaultLocale?: string;
      defaultCurrency?: string;
    },
  ) {
    this.ensureTenantAccess(actorTenantId, tenantId);
    const currentTenant = await this.getById(tenantId);

    if (input.slug) {
      const normalizedSlug = this.normalizeSlug(input.slug);
      const existingTenant = await this.repository.findBySlug(normalizedSlug);

      if (existingTenant && existingTenant.id !== tenantId) {
        throw new ConflictException("Tenant slug already exists");
      }

      input.slug = normalizedSlug;
    }

    const tenant = await this.repository.update({ tenantId, ...input });

    await this.auditService.record({
      tenantId,
      actorUserId,
      action:
        tenant.status !== currentTenant.status && tenant.status === "INACTIVE"
          ? "tenant.deactivated"
          : "tenant.updated",
      entityType: "tenant",
      entityId: tenant.id,
      metadata: {
        previousStatus: currentTenant.status,
        nextStatus: tenant.status,
      },
    });

    return tenant;
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

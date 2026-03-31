import { describe, expect, it } from "vitest";

import { AuditService } from "src/modules/audit/application/services/audit.service";
import { TenantService } from "src/modules/tenant/application/services/tenant.service";
import { TenantView } from "src/modules/tenant/domain/entities/tenant-record";
import { TenantRepository } from "src/modules/tenant/domain/repositories/tenant.repository";

class InMemoryTenantRepository implements TenantRepository {
  tenants = new Map<string, TenantView>();

  async create(input: {
    slug: string;
    name: string;
    defaultLocale: string;
    defaultCurrency: string;
  }) {
    const tenant: TenantView = {
      id: `tenant-${this.tenants.size + 1}`,
      slug: input.slug,
      name: input.name,
      status: "ACTIVE",
      defaultLocale: input.defaultLocale,
      defaultCurrency: input.defaultCurrency,
    };
    this.tenants.set(tenant.id, tenant);
    return tenant;
  }

  async list() {
    return Array.from(this.tenants.values());
  }

  async findById(tenantId: string) {
    return this.tenants.get(tenantId) || null;
  }

  async findBySlug(slug: string) {
    return (
      Array.from(this.tenants.values()).find(
        (tenant) => tenant.slug === slug,
      ) || null
    );
  }

  async update(input: {
    tenantId: string;
    slug?: string;
    name?: string;
    status?: "ACTIVE" | "INACTIVE";
    defaultLocale?: string;
    defaultCurrency?: string;
  }) {
    const tenant = this.tenants.get(input.tenantId)!;
    const nextTenant: TenantView = {
      ...tenant,
      slug: input.slug || tenant.slug,
      name: input.name || tenant.name,
      status: input.status || tenant.status,
      defaultLocale: input.defaultLocale || tenant.defaultLocale,
      defaultCurrency: input.defaultCurrency || tenant.defaultCurrency,
    };
    this.tenants.set(input.tenantId, nextTenant);
    return nextTenant;
  }
}

class AuditServiceStub {
  async record() {
    return;
  }
}

describe("Tenant module unit tests", () => {
  it("creates a tenant with valid name and slug", async () => {
    const service = new TenantService(
      new InMemoryTenantRepository(),
      new AuditServiceStub() as unknown as AuditService,
    );
    const tenant = await service.create(null, {
      slug: "Acme Store",
      name: "Acme Store",
    });

    expect(tenant.slug).toBe("acme-store");
    expect(tenant.name).toBe("Acme Store");
  });

  it("normalizes or validates slug format", () => {
    const service = new TenantService(
      new InMemoryTenantRepository(),
      new AuditServiceStub() as unknown as AuditService,
    );
    expect(service.normalizeSlug("  Hello World  ")).toBe("hello-world");
  });

  it("rejects a duplicate tenant slug", async () => {
    const service = new TenantService(
      new InMemoryTenantRepository(),
      new AuditServiceStub() as unknown as AuditService,
    );
    await service.create(null, { slug: "acme-store", name: "Acme Store" });

    await expect(
      service.create(null, { slug: "Acme Store", name: "Other Acme" }),
    ).rejects.toThrow("Tenant slug already exists");
  });

  it("updates tenant metadata", async () => {
    const service = new TenantService(
      new InMemoryTenantRepository(),
      new AuditServiceStub() as unknown as AuditService,
    );
    const tenant = await service.create(null, {
      slug: "acme-store",
      name: "Acme Store",
    });
    const updated = await service.update("user-1", tenant.id, tenant.id, {
      name: "Acme 2",
    });

    expect(updated.name).toBe("Acme 2");
  });

  it("deactivates a tenant", async () => {
    const service = new TenantService(
      new InMemoryTenantRepository(),
      new AuditServiceStub() as unknown as AuditService,
    );
    const tenant = await service.create(null, {
      slug: "acme-store",
      name: "Acme Store",
    });
    const updated = await service.update("user-1", tenant.id, tenant.id, {
      status: "INACTIVE",
    });

    expect(updated.status).toBe("INACTIVE");
  });

  it("rejects access to tenant data from another tenant context when enforced in service logic", () => {
    const service = new TenantService(
      new InMemoryTenantRepository(),
      new AuditServiceStub() as unknown as AuditService,
    );
    expect(() => service.ensureTenantAccess("tenant-a", "tenant-b")).toThrow(
      "Cross-tenant access is not allowed",
    );
  });
});

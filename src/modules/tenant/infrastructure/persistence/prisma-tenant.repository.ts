import { Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";

import { TenantView } from "../../domain/entities/tenant-record";
import {
  CreateTenantInput,
  TenantRepository,
  UpdateTenantInput,
} from "../../domain/repositories/tenant.repository";

@Injectable()
export class PrismaTenantRepository implements TenantRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateTenantInput): Promise<TenantView> {
    const tenant = await this.prisma.tenant.create({
      data: {
        slug: input.slug,
        name: input.name,
        settings: {
          create: {
            defaultLocale: input.defaultLocale,
            defaultCurrency: input.defaultCurrency,
          },
        },
      },
      include: { settings: true },
    });

    return this.mapTenant(tenant);
  }

  async list(): Promise<TenantView[]> {
    const tenants = await this.prisma.tenant.findMany({
      include: { settings: true },
      orderBy: { createdAt: "asc" },
    });
    return tenants.map((tenant) => this.mapTenant(tenant));
  }

  async findById(tenantId: string): Promise<TenantView | null> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { settings: true },
    });
    return tenant ? this.mapTenant(tenant) : null;
  }

  async findBySlug(slug: string): Promise<TenantView | null> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      include: { settings: true },
    });
    return tenant ? this.mapTenant(tenant) : null;
  }

  async update(input: UpdateTenantInput): Promise<TenantView> {
    const tenant = await this.prisma.tenant
      .update({
        where: { id: input.tenantId },
        data: {
          slug: input.slug,
          name: input.name,
          status: input.status,
          settings: {
            update: {
              defaultLocale: input.defaultLocale,
              defaultCurrency: input.defaultCurrency,
            },
          },
        },
        include: { settings: true },
      })
      .catch(() => {
        throw new NotFoundException("Tenant not found");
      });

    return this.mapTenant(tenant);
  }

  private mapTenant(tenant: {
    id: string;
    slug: string;
    name: string;
    status: "ACTIVE" | "INACTIVE";
    settings: { defaultLocale: string; defaultCurrency: string } | null;
  }): TenantView {
    return {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      status: tenant.status,
      defaultLocale: tenant.settings?.defaultLocale || "en",
      defaultCurrency: tenant.settings?.defaultCurrency || "USD",
    };
  }
}

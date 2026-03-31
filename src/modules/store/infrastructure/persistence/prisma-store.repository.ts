import { Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";

import { StoreView } from "../../domain/entities/store-record";
import {
  CreateStoreInput,
  StoreRepository,
  UpdateStoreInput,
} from "../../domain/repositories/store.repository";

@Injectable()
export class PrismaStoreRepository implements StoreRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateStoreInput): Promise<StoreView> {
    const store = await this.prisma.store.create({
      data: {
        tenantId: input.tenantId,
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

    return this.mapStore(store);
  }

  async listByTenant(tenantId: string): Promise<StoreView[]> {
    const stores = await this.prisma.store.findMany({
      where: { tenantId },
      include: { settings: true },
      orderBy: { createdAt: "asc" },
    });

    return stores.map((store) => this.mapStore(store));
  }

  async findById(storeId: string): Promise<StoreView | null> {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      include: { settings: true },
    });
    return store ? this.mapStore(store) : null;
  }

  async findByTenantAndSlug(
    tenantId: string,
    slug: string,
  ): Promise<StoreView | null> {
    const store = await this.prisma.store.findUnique({
      where: { tenantId_slug: { tenantId, slug } },
      include: { settings: true },
    });

    return store ? this.mapStore(store) : null;
  }

  async update(input: UpdateStoreInput): Promise<StoreView> {
    const store = await this.prisma.store
      .update({
        where: { id: input.storeId },
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
        throw new NotFoundException("Store not found");
      });

    return this.mapStore(store);
  }

  private mapStore(store: {
    id: string;
    tenantId: string;
    slug: string;
    name: string;
    status: "ACTIVE" | "INACTIVE";
    settings: { defaultLocale: string; defaultCurrency: string } | null;
  }): StoreView {
    return {
      id: store.id,
      tenantId: store.tenantId,
      slug: store.slug,
      name: store.name,
      status: store.status,
      defaultLocale: store.settings?.defaultLocale || "en",
      defaultCurrency: store.settings?.defaultCurrency || "USD",
    };
  }
}

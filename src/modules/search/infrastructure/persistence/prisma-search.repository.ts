import { Injectable } from "@nestjs/common";
import { CatalogStatus } from "@prisma/client";

import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";

import {
  ProductSearchDocument,
  ProductSearchResult,
} from "../../domain/entities/search-records";
import {
  SearchProductsInput,
  SearchRepository,
} from "../../domain/repositories/search.repository";

@Injectable()
export class PrismaSearchRepository implements SearchRepository {
  constructor(private readonly prisma: PrismaService) {}

  async searchProducts(
    input: SearchProductsInput,
  ): Promise<ProductSearchResult> {
    const where: any = {
      storeId: input.storeId,
      status: CatalogStatus.PUBLISHED,
    };

    if (input.query) {
      where.OR = [
        { title: { contains: input.query, mode: "insensitive" } },
        { description: { contains: input.query, mode: "insensitive" } },
      ];
    }

    if (input.category) {
      where.categories = { some: { category: { slug: input.category } } };
    }

    if (input.collection) {
      where.collections = { some: { collection: { slug: input.collection } } };
    }

    const orderBy =
      input.sortBy === "title"
        ? { title: input.sortOrder || "asc" }
        : { createdAt: input.sortOrder || "desc" };

    const [total, products] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        orderBy,
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
        include: {
          brand: true,
          categories: { include: { category: true } },
          collections: { include: { collection: true } },
          tags: { include: { tag: true } },
          variants: {
            orderBy: { createdAt: "asc" },
            include: { prices: { orderBy: { createdAt: "asc" } } },
          },
        },
      }),
    ]);

    return {
      items: products.map((product) => this.mapProduct(product)),
      total,
      page: input.page,
      pageSize: input.pageSize,
    };
  }

  private mapProduct(product: any): ProductSearchDocument {
    const firstVariant = product.variants[0];
    const firstPrice = firstVariant?.prices?.[0] || null;

    return {
      productId: product.id,
      tenantId: product.tenantId,
      storeId: product.storeId,
      slug: product.slug,
      title: product.title,
      description: product.description,
      status: "PUBLISHED",
      brand: product.brand?.name || null,
      categories: product.categories.map((entry: any) => entry.category.slug),
      collections: product.collections.map(
        (entry: any) => entry.collection.slug,
      ),
      tags: product.tags.map((entry: any) => entry.tag.value),
      createdAt: product.createdAt,
      defaultPrice: firstPrice
        ? { currencyCode: firstPrice.currencyCode, amount: firstPrice.amount }
        : null,
    };
  }

  async countPublishedProducts(): Promise<number> {
    return this.prisma.product.count({
      where: { status: CatalogStatus.PUBLISHED },
    });
  }
}

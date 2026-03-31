import { Injectable, NotFoundException } from "@nestjs/common";
import { CatalogStatus } from "@prisma/client";

import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";

import {
  CategoryRecord,
  CollectionRecord,
  ProductRecord,
  ProductVariantRecord,
} from "../../domain/entities/catalog-records";
import {
  AttachProductToCollectionInput,
  CatalogRepository,
  CreateCategoryInput,
  CreateCollectionInput,
  CreateProductInput,
  CreateVariantInput,
  UpdateProductInput,
} from "../../domain/repositories/catalog.repository";

@Injectable()
export class PrismaCatalogRepository implements CatalogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createProduct(input: CreateProductInput): Promise<ProductRecord> {
    const product = await this.prisma.product.create({
      data: {
        tenantId: input.tenantId,
        storeId: input.storeId,
        slug: input.slug,
        title: input.title,
        description: input.description || null,
        status: (input.status || "DRAFT") as CatalogStatus,
        brandId: input.brandId || null,
      },
    });

    return this.mapProduct(product);
  }

  async listProducts(tenantId: string): Promise<ProductRecord[]> {
    const products = await this.prisma.product.findMany({
      where: { tenantId },
      orderBy: { createdAt: "asc" },
    });
    return products.map((product) => this.mapProduct(product));
  }

  async findProductById(productId: string): Promise<ProductRecord | null> {
    const product = await this.prisma.product
      .findUnique({ where: { id: productId } })
      .catch(() => null);
    return product ? this.mapProduct(product) : null;
  }

  async findProductByStoreAndSlug(
    storeId: string,
    slug: string,
  ): Promise<ProductRecord | null> {
    const product = await this.prisma.product.findUnique({
      where: { storeId_slug: { storeId, slug } },
    });
    return product ? this.mapProduct(product) : null;
  }

  async updateProduct(input: UpdateProductInput): Promise<ProductRecord> {
    const product = await this.prisma.product
      .update({
        where: { id: input.productId },
        data: {
          slug: input.slug,
          title: input.title,
          description: input.description,
          status: input.status as CatalogStatus | undefined,
          brandId: input.brandId,
        },
      })
      .catch(() => {
        throw new NotFoundException("Product not found");
      });

    return this.mapProduct(product);
  }

  async createVariant(
    input: CreateVariantInput,
  ): Promise<ProductVariantRecord> {
    const variant = await this.prisma.productVariant.create({
      data: {
        productId: input.productId,
        sku: input.sku,
        title: input.title,
        status: (input.status || "DRAFT") as CatalogStatus,
      },
    });
    return this.mapVariant(variant);
  }

  async listVariants(productId: string): Promise<ProductVariantRecord[]> {
    const variants = await this.prisma.productVariant.findMany({
      where: { productId },
      orderBy: { createdAt: "asc" },
    });
    return variants.map((variant) => this.mapVariant(variant));
  }

  async findVariantBySku(
    productId: string,
    sku: string,
  ): Promise<ProductVariantRecord | null> {
    const variant = await this.prisma.productVariant.findUnique({
      where: { productId_sku: { productId, sku } },
    });
    return variant ? this.mapVariant(variant) : null;
  }

  async updateVariantStatus(
    variantId: string,
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED",
  ): Promise<ProductVariantRecord> {
    const variant = await this.prisma.productVariant
      .update({
        where: { id: variantId },
        data: { status: status as CatalogStatus },
      })
      .catch(() => {
        throw new NotFoundException("Variant not found");
      });
    return this.mapVariant(variant);
  }

  async createCategory(input: CreateCategoryInput): Promise<CategoryRecord> {
    const category = await this.prisma.category.create({
      data: {
        tenantId: input.tenantId,
        storeId: input.storeId,
        slug: input.slug,
        name: input.name,
        parentId: input.parentId || null,
      },
    });
    return this.mapCategory(category);
  }

  async listCategories(tenantId: string): Promise<CategoryRecord[]> {
    const categories = await this.prisma.category.findMany({
      where: { tenantId },
      orderBy: { createdAt: "asc" },
    });
    return categories.map((category) => this.mapCategory(category));
  }

  async findCategoryByStoreAndSlug(
    storeId: string,
    slug: string,
  ): Promise<CategoryRecord | null> {
    const category = await this.prisma.category.findUnique({
      where: { storeId_slug: { storeId, slug } },
    });
    return category ? this.mapCategory(category) : null;
  }

  async createCollection(
    input: CreateCollectionInput,
  ): Promise<CollectionRecord> {
    const collection = await this.prisma.collection.create({
      data: {
        tenantId: input.tenantId,
        storeId: input.storeId,
        slug: input.slug,
        name: input.name,
      },
    });
    return this.mapCollection(collection);
  }

  async listCollections(tenantId: string): Promise<CollectionRecord[]> {
    const collections = await this.prisma.collection.findMany({
      where: { tenantId },
      orderBy: { createdAt: "asc" },
    });
    return collections.map((collection) => this.mapCollection(collection));
  }

  async findCollectionByStoreAndSlug(
    storeId: string,
    slug: string,
  ): Promise<CollectionRecord | null> {
    const collection = await this.prisma.collection.findUnique({
      where: { storeId_slug: { storeId, slug } },
    });
    return collection ? this.mapCollection(collection) : null;
  }

  async attachProductToCollection(
    input: AttachProductToCollectionInput,
  ): Promise<void> {
    await this.prisma.productCollection.create({
      data: { productId: input.productId, collectionId: input.collectionId },
    });
  }

  async listPublishedProductsByStore(
    storeId: string,
  ): Promise<ProductRecord[]> {
    const products = await this.prisma.product.findMany({
      where: { storeId, status: CatalogStatus.PUBLISHED },
      orderBy: { createdAt: "asc" },
    });
    return products.map((product) => this.mapProduct(product));
  }

  async findPublishedProductByStoreAndSlug(
    storeId: string,
    slug: string,
  ): Promise<ProductRecord | null> {
    const product = await this.prisma.product.findFirst({
      where: { storeId, slug, status: CatalogStatus.PUBLISHED },
    });
    return product ? this.mapProduct(product) : null;
  }

  private mapProduct(product: {
    id: string;
    tenantId: string;
    storeId: string;
    slug: string;
    title: string;
    description: string | null;
    status: CatalogStatus;
    brandId: string | null;
  }): ProductRecord {
    return {
      id: product.id,
      tenantId: product.tenantId,
      storeId: product.storeId,
      slug: product.slug,
      title: product.title,
      description: product.description,
      status: product.status,
      brandId: product.brandId,
    };
  }

  private mapVariant(variant: {
    id: string;
    productId: string;
    sku: string;
    title: string;
    status: CatalogStatus;
  }): ProductVariantRecord {
    return {
      id: variant.id,
      productId: variant.productId,
      sku: variant.sku,
      title: variant.title,
      status: variant.status,
    };
  }

  private mapCategory(category: {
    id: string;
    tenantId: string;
    storeId: string;
    slug: string;
    name: string;
    parentId: string | null;
  }): CategoryRecord {
    return {
      id: category.id,
      tenantId: category.tenantId,
      storeId: category.storeId,
      slug: category.slug,
      name: category.name,
      parentId: category.parentId,
    };
  }

  private mapCollection(collection: {
    id: string;
    tenantId: string;
    storeId: string;
    slug: string;
    name: string;
  }): CollectionRecord {
    return {
      id: collection.id,
      tenantId: collection.tenantId,
      storeId: collection.storeId,
      slug: collection.slug,
      name: collection.name,
    };
  }
}

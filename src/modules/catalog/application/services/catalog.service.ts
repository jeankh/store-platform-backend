import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { AuditService } from "src/modules/audit/application/services/audit.service";

import {
  CategoryRecord,
  CollectionRecord,
  ProductRecord,
  ProductVariantRecord,
} from "../../domain/entities/catalog-records";
import { CatalogRepository } from "../../domain/repositories/catalog.repository";
import { CATALOG_REPOSITORY } from "../../domain/repositories/catalog.repository.token";

@Injectable()
export class CatalogService {
  constructor(
    @Inject(CATALOG_REPOSITORY) private readonly repository: CatalogRepository,
    @Inject(AuditService) private readonly auditService: AuditService,
  ) {}

  async createProduct(
    actorUserId: string,
    actorTenantId: string,
    input: {
      tenantId: string;
      storeId: string;
      slug: string;
      title: string;
      description?: string | null;
      status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
      brandId?: string | null;
    },
  ): Promise<ProductRecord> {
    this.ensureTenantAccess(actorTenantId, input.tenantId);
    const normalizedSlug = this.normalizeSlug(input.slug);
    const existingProduct = await this.repository.findProductByStoreAndSlug(
      input.storeId,
      normalizedSlug,
    );
    if (existingProduct)
      throw new ConflictException("Product slug already exists for store");
    const product = await this.repository.createProduct({
      ...input,
      slug: normalizedSlug,
    });
    await this.auditService.record({
      tenantId: input.tenantId,
      actorUserId,
      action: "catalog.product.created",
      entityType: "product",
      entityId: product.id,
      metadata: { slug: product.slug },
    });
    return product;
  }

  listProducts(actorTenantId: string) {
    return this.repository.listProducts(actorTenantId);
  }

  async getProduct(actorTenantId: string, productId: string) {
    const product = await this.repository.findProductById(productId);
    if (!product) throw new NotFoundException("Product not found");
    this.ensureTenantAccess(actorTenantId, product.tenantId);
    return product;
  }

  async updateProduct(
    actorUserId: string,
    actorTenantId: string,
    productId: string,
    input: {
      slug?: string;
      title?: string;
      description?: string | null;
      status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
      brandId?: string | null;
    },
  ) {
    const currentProduct = await this.getProduct(actorTenantId, productId);
    if (input.slug) {
      const normalizedSlug = this.normalizeSlug(input.slug);
      const existingProduct = await this.repository.findProductByStoreAndSlug(
        currentProduct.storeId,
        normalizedSlug,
      );
      if (existingProduct && existingProduct.id !== productId)
        throw new ConflictException("Product slug already exists for store");
      input.slug = normalizedSlug;
    }
    const product = await this.repository.updateProduct({
      productId,
      ...input,
    });
    await this.auditService.record({
      tenantId: product.tenantId,
      actorUserId,
      action:
        input.status === "PUBLISHED"
          ? "catalog.product.published"
          : "catalog.product.updated",
      entityType: "product",
      entityId: product.id,
      metadata: { status: product.status },
    });
    return product;
  }

  async createVariant(
    actorUserId: string,
    actorTenantId: string,
    productId: string,
    input: {
      sku: string;
      title: string;
      status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    },
  ): Promise<ProductVariantRecord> {
    const product = await this.getProduct(actorTenantId, productId);
    const existingVariant = await this.repository.findVariantBySku(
      product.id,
      input.sku,
    );
    if (existingVariant)
      throw new ConflictException("Variant SKU already exists for product");
    const variant = await this.repository.createVariant({
      productId: product.id,
      ...input,
    });
    await this.auditService.record({
      tenantId: product.tenantId,
      actorUserId,
      action: "catalog.variant.created",
      entityType: "product_variant",
      entityId: variant.id,
      metadata: { sku: variant.sku },
    });
    return variant;
  }

  async updateVariantStatus(
    actorTenantId: string,
    variantId: string,
    productId: string,
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED",
  ) {
    const product = await this.getProduct(actorTenantId, productId);
    const variants = await this.repository.listVariants(product.id);
    const variant = variants.find((entry) => entry.id === variantId);
    if (!variant) throw new NotFoundException("Variant not found");
    return this.repository.updateVariantStatus(variantId, status);
  }

  async createCategory(
    actorUserId: string,
    actorTenantId: string,
    input: {
      tenantId: string;
      storeId: string;
      slug: string;
      name: string;
      parentId?: string | null;
    },
  ): Promise<CategoryRecord> {
    this.ensureTenantAccess(actorTenantId, input.tenantId);
    const normalizedSlug = this.normalizeSlug(input.slug);
    const existingCategory = await this.repository.findCategoryByStoreAndSlug(
      input.storeId,
      normalizedSlug,
    );
    if (existingCategory)
      throw new ConflictException("Category slug already exists for store");
    const category = await this.repository.createCategory({
      ...input,
      slug: normalizedSlug,
    });
    await this.auditService.record({
      tenantId: input.tenantId,
      actorUserId,
      action: "catalog.category.created",
      entityType: "category",
      entityId: category.id,
      metadata: { slug: category.slug },
    });
    return category;
  }

  listCategories(actorTenantId: string) {
    return this.repository.listCategories(actorTenantId);
  }

  async createCollection(
    actorUserId: string,
    actorTenantId: string,
    input: { tenantId: string; storeId: string; slug: string; name: string },
  ): Promise<CollectionRecord> {
    this.ensureTenantAccess(actorTenantId, input.tenantId);
    const normalizedSlug = this.normalizeSlug(input.slug);
    const existingCollection =
      await this.repository.findCollectionByStoreAndSlug(
        input.storeId,
        normalizedSlug,
      );
    if (existingCollection)
      throw new ConflictException("Collection slug already exists for store");
    const collection = await this.repository.createCollection({
      ...input,
      slug: normalizedSlug,
    });
    await this.auditService.record({
      tenantId: input.tenantId,
      actorUserId,
      action: "catalog.collection.created",
      entityType: "collection",
      entityId: collection.id,
      metadata: { slug: collection.slug },
    });
    return collection;
  }

  listCollections(actorTenantId: string) {
    return this.repository.listCollections(actorTenantId);
  }

  async attachProductToCollection(
    actorUserId: string,
    actorTenantId: string,
    productId: string,
    collectionId: string,
  ): Promise<void> {
    const product = await this.getProduct(actorTenantId, productId);
    const collections = await this.repository.listCollections(actorTenantId);
    const collection = collections.find((entry) => entry.id === collectionId);
    if (!collection) throw new NotFoundException("Collection not found");
    await this.repository.attachProductToCollection({
      productId,
      collectionId,
    });
    await this.auditService.record({
      tenantId: product.tenantId,
      actorUserId,
      action: "catalog.collection.product_attached",
      entityType: "product_collection",
      entityId: `${productId}:${collectionId}`,
      metadata: { productId, collectionId },
    });
  }

  listPublishedProducts(storeId: string) {
    return this.repository.listPublishedProductsByStore(storeId);
  }

  async getPublishedProductBySlug(storeId: string, slug: string) {
    const product = await this.repository.findPublishedProductByStoreAndSlug(
      storeId,
      this.normalizeSlug(slug),
    );
    if (!product) throw new NotFoundException("Product not found");
    return product;
  }

  private ensureTenantAccess(actorTenantId: string, targetTenantId: string) {
    if (actorTenantId !== targetTenantId)
      throw new ForbiddenException("Cross-tenant access is not allowed");
  }

  private normalizeSlug(slug: string) {
    return slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
}

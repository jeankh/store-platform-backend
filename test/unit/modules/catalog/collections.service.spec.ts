import { describe, expect, it } from "vitest";

import { AuditService } from "src/modules/audit/application/services/audit.service";
import { CatalogService } from "src/modules/catalog/application/services/catalog.service";
import {
  CategoryRecord,
  CollectionRecord,
  ProductRecord,
  ProductVariantRecord,
} from "src/modules/catalog/domain/entities/catalog-records";
import { CatalogRepository } from "src/modules/catalog/domain/repositories/catalog.repository";

class InMemoryCatalogRepository implements CatalogRepository {
  products = new Map<string, ProductRecord>();
  collections = new Map<string, CollectionRecord>();
  links: Array<{ productId: string; collectionId: string }> = [];
  async createProduct(input: any) {
    const product = {
      id: `product-${this.products.size + 1}`,
      tenantId: input.tenantId,
      storeId: input.storeId,
      slug: input.slug,
      title: input.title,
      description: null,
      status: "DRAFT",
      brandId: null,
    } as ProductRecord;
    this.products.set(product.id, product);
    return product;
  }
  async listProducts() {
    return [];
  }
  async findProductById(productId: string) {
    return this.products.get(productId) || null;
  }
  async findProductByStoreAndSlug() {
    return null;
  }
  async updateProduct(input: any) {
    return {
      id: input.productId || "product-1",
      tenantId: "tenant-1",
      storeId: "store-1",
      slug: "p",
      title: "p",
      description: null,
      status: input.status || "DRAFT",
      brandId: null,
    } as ProductRecord;
  }
  async createVariant() {
    return {
      id: "variant-1",
      productId: "product-1",
      sku: "SKU",
      title: "Variant",
      status: "DRAFT",
    } as ProductVariantRecord;
  }
  async listVariants() {
    return [];
  }
  async findVariantBySku() {
    return null;
  }
  async updateVariantStatus() {
    return {
      id: "variant-1",
      productId: "product-1",
      sku: "SKU",
      title: "Variant",
      status: "DRAFT",
    } as ProductVariantRecord;
  }
  async createCategory() {
    return {
      id: "category-1",
      tenantId: "tenant-1",
      storeId: "store-1",
      slug: "cat",
      name: "Cat",
      parentId: null,
    } as CategoryRecord;
  }
  async listCategories() {
    return [];
  }
  async findCategoryByStoreAndSlug() {
    return null;
  }
  async createCollection(input: any) {
    const collection = {
      id: `collection-${this.collections.size + 1}`,
      tenantId: input.tenantId,
      storeId: input.storeId,
      slug: input.slug,
      name: input.name,
    } as CollectionRecord;
    this.collections.set(collection.id, collection);
    return collection;
  }
  async listCollections(tenantId: string) {
    return Array.from(this.collections.values()).filter(
      (collection) => collection.tenantId === tenantId,
    );
  }
  async findCollectionByStoreAndSlug(storeId: string, slug: string) {
    return (
      Array.from(this.collections.values()).find(
        (collection) =>
          collection.storeId === storeId && collection.slug === slug,
      ) || null
    );
  }
  async attachProductToCollection(input: any) {
    this.links.push(input);
  }
  async listPublishedProductsByStore() {
    return [];
  }
  async findPublishedProductByStoreAndSlug() {
    return null;
  }
}

class AuditServiceStub {
  async record() {
    return;
  }
}

describe("Catalog collections unit tests", () => {
  it("creates collection with valid store scope", async () => {
    const service = new CatalogService(
      new InMemoryCatalogRepository(),
      new AuditServiceStub() as unknown as AuditService,
    );
    const collection = await service.createCollection("user-1", "tenant-1", {
      tenantId: "tenant-1",
      storeId: "store-1",
      slug: "summer",
      name: "Summer",
    });
    expect(collection.slug).toBe("summer");
  });
  it("rejects duplicate collection slug within a store", async () => {
    const service = new CatalogService(
      new InMemoryCatalogRepository(),
      new AuditServiceStub() as unknown as AuditService,
    );
    await service.createCollection("user-1", "tenant-1", {
      tenantId: "tenant-1",
      storeId: "store-1",
      slug: "summer",
      name: "Summer",
    });
    await expect(
      service.createCollection("user-1", "tenant-1", {
        tenantId: "tenant-1",
        storeId: "store-1",
        slug: "summer",
        name: "Summer 2",
      }),
    ).rejects.toThrow("Collection slug already exists for store");
  });
  it("attaches products to a collection", async () => {
    const repo = new InMemoryCatalogRepository();
    const service = new CatalogService(
      repo,
      new AuditServiceStub() as unknown as AuditService,
    );
    const product = await repo.createProduct({
      tenantId: "tenant-1",
      storeId: "store-1",
      slug: "p",
      title: "Product",
    });
    const collection = await service.createCollection("user-1", "tenant-1", {
      tenantId: "tenant-1",
      storeId: "store-1",
      slug: "summer",
      name: "Summer",
    });
    await service.attachProductToCollection(
      "user-1",
      "tenant-1",
      product.id,
      collection.id,
    );
    expect(repo.links).toHaveLength(1);
  });
});

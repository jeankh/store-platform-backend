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
  categories = new Map<string, CategoryRecord>();
  async createProduct() {
    return {
      id: "product-1",
      tenantId: "tenant-1",
      storeId: "store-1",
      slug: "p",
      title: "p",
      description: null,
      status: "DRAFT",
      brandId: null,
    } as ProductRecord;
  }
  async listProducts() {
    return [];
  }
  async findProductById() {
    return null;
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
  async createCategory(input: any) {
    const category = {
      id: `category-${this.categories.size + 1}`,
      tenantId: input.tenantId,
      storeId: input.storeId,
      slug: input.slug,
      name: input.name,
      parentId: input.parentId || null,
    } as CategoryRecord;
    this.categories.set(category.id, category);
    return category;
  }
  async listCategories(tenantId: string) {
    return Array.from(this.categories.values()).filter(
      (category) => category.tenantId === tenantId,
    );
  }
  async findCategoryByStoreAndSlug(storeId: string, slug: string) {
    return (
      Array.from(this.categories.values()).find(
        (category) => category.storeId === storeId && category.slug === slug,
      ) || null
    );
  }
  async createCollection() {
    return {
      id: "collection-1",
      tenantId: "tenant-1",
      storeId: "store-1",
      slug: "c",
      name: "Collection",
    } as CollectionRecord;
  }
  async listCollections() {
    return [];
  }
  async findCollectionByStoreAndSlug() {
    return null;
  }
  async attachProductToCollection() {
    return;
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

describe("Catalog categories unit tests", () => {
  it("creates category with valid store scope", async () => {
    const service = new CatalogService(
      new InMemoryCatalogRepository(),
      new AuditServiceStub() as unknown as AuditService,
    );
    const category = await service.createCategory("user-1", "tenant-1", {
      tenantId: "tenant-1",
      storeId: "store-1",
      slug: "summer",
      name: "Summer",
    });
    expect(category.slug).toBe("summer");
  });
  it("supports unlimited nesting through parent_id", async () => {
    const repo = new InMemoryCatalogRepository();
    const service = new CatalogService(
      repo,
      new AuditServiceStub() as unknown as AuditService,
    );
    const parent = await service.createCategory("user-1", "tenant-1", {
      tenantId: "tenant-1",
      storeId: "store-1",
      slug: "parent",
      name: "Parent",
    });
    const child = await service.createCategory("user-1", "tenant-1", {
      tenantId: "tenant-1",
      storeId: "store-1",
      slug: "child",
      name: "Child",
      parentId: parent.id,
    });
    expect(child.parentId).toBe(parent.id);
  });
  it("rejects duplicate category slug within a store", async () => {
    const service = new CatalogService(
      new InMemoryCatalogRepository(),
      new AuditServiceStub() as unknown as AuditService,
    );
    await service.createCategory("user-1", "tenant-1", {
      tenantId: "tenant-1",
      storeId: "store-1",
      slug: "summer",
      name: "Summer",
    });
    await expect(
      service.createCategory("user-1", "tenant-1", {
        tenantId: "tenant-1",
        storeId: "store-1",
        slug: "summer",
        name: "Summer 2",
      }),
    ).rejects.toThrow("Category slug already exists for store");
  });
});

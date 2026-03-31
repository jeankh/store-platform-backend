import { describe, expect, it } from "vitest";

import { AuditService } from "src/modules/audit/application/services/audit.service";
import { CatalogService } from "src/modules/catalog/application/services/catalog.service";
import {
  ProductRecord,
  ProductVariantRecord,
} from "src/modules/catalog/domain/entities/catalog-records";
import { CatalogRepository } from "src/modules/catalog/domain/repositories/catalog.repository";

class InMemoryCatalogRepository implements CatalogRepository {
  products = new Map<string, ProductRecord>();
  variants = new Map<string, ProductVariantRecord>();
  async createProduct(input: any) {
    const product = {
      id: `product-${this.products.size + 1}`,
      tenantId: input.tenantId,
      storeId: input.storeId,
      slug: input.slug,
      title: input.title,
      description: input.description || null,
      status: input.status || "DRAFT",
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
    return this.products.get(input.productId)!;
  }
  async createVariant(input: any) {
    const variant = {
      id: `variant-${this.variants.size + 1}`,
      productId: input.productId,
      sku: input.sku,
      title: input.title,
      status: input.status || "DRAFT",
    } as ProductVariantRecord;
    this.variants.set(variant.id, variant);
    return variant;
  }
  async listVariants(productId: string) {
    return Array.from(this.variants.values()).filter(
      (variant) => variant.productId === productId,
    );
  }
  async findVariantBySku(productId: string, sku: string) {
    return (
      Array.from(this.variants.values()).find(
        (variant) => variant.productId === productId && variant.sku === sku,
      ) || null
    );
  }
  async updateVariantStatus(
    variantId: string,
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED",
  ) {
    const variant = this.variants.get(variantId)!;
    const next = { ...variant, status };
    this.variants.set(variantId, next);
    return next;
  }
}

class AuditServiceStub {
  async record() {
    return;
  }
}

describe("Catalog product variants unit tests", () => {
  it("creates variant under existing product", async () => {
    const repo = new InMemoryCatalogRepository();
    const service = new CatalogService(
      repo,
      new AuditServiceStub() as unknown as AuditService,
    );
    const product = await repo.createProduct({
      tenantId: "tenant-1",
      storeId: "store-1",
      slug: "my-product",
      title: "My Product",
    });
    const variant = await service.createVariant(
      "user-1",
      "tenant-1",
      product.id,
      { sku: "SKU-1", title: "Variant 1" },
    );
    expect(variant.sku).toBe("SKU-1");
  });
  it("rejects variant creation under missing product", async () => {
    const service = new CatalogService(
      new InMemoryCatalogRepository(),
      new AuditServiceStub() as unknown as AuditService,
    );
    await expect(
      service.createVariant("user-1", "tenant-1", "missing-product", {
        sku: "SKU-1",
        title: "Variant 1",
      }),
    ).rejects.toThrow("Product not found");
  });
  it("rejects duplicate sku within the same product", async () => {
    const repo = new InMemoryCatalogRepository();
    const service = new CatalogService(
      repo,
      new AuditServiceStub() as unknown as AuditService,
    );
    const product = await repo.createProduct({
      tenantId: "tenant-1",
      storeId: "store-1",
      slug: "my-product",
      title: "My Product",
    });
    await service.createVariant("user-1", "tenant-1", product.id, {
      sku: "SKU-1",
      title: "Variant 1",
    });
    await expect(
      service.createVariant("user-1", "tenant-1", product.id, {
        sku: "SKU-1",
        title: "Variant 2",
      }),
    ).rejects.toThrow("Variant SKU already exists for product");
  });
  it("updates variant status correctly", async () => {
    const repo = new InMemoryCatalogRepository();
    const service = new CatalogService(
      repo,
      new AuditServiceStub() as unknown as AuditService,
    );
    const product = await repo.createProduct({
      tenantId: "tenant-1",
      storeId: "store-1",
      slug: "my-product",
      title: "My Product",
    });
    const variant = await service.createVariant(
      "user-1",
      "tenant-1",
      product.id,
      { sku: "SKU-1", title: "Variant 1" },
    );
    const updated = await service.updateVariantStatus(
      "tenant-1",
      variant.id,
      product.id,
      "PUBLISHED",
    );
    expect(updated.status).toBe("PUBLISHED");
  });
});

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
      brandId: input.brandId || null,
    } as ProductRecord;
    this.products.set(product.id, product);
    return product;
  }
  async listProducts(tenantId: string) {
    return Array.from(this.products.values()).filter(
      (product) => product.tenantId === tenantId,
    );
  }
  async findProductById(productId: string) {
    return this.products.get(productId) || null;
  }
  async findProductByStoreAndSlug(storeId: string, slug: string) {
    return (
      Array.from(this.products.values()).find(
        (product) => product.storeId === storeId && product.slug === slug,
      ) || null
    );
  }
  async updateProduct(input: any) {
    const product = this.products.get(input.productId)!;
    const next = { ...product, ...input };
    this.products.set(input.productId, next);
    return next;
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

describe("Catalog product unit tests", () => {
  it("creates product with valid store scope", async () => {
    const service = new CatalogService(
      new InMemoryCatalogRepository(),
      new AuditServiceStub() as unknown as AuditService,
    );
    const product = await service.createProduct("user-1", "tenant-1", {
      tenantId: "tenant-1",
      storeId: "store-1",
      slug: "my-product",
      title: "My Product",
    });
    expect(product.slug).toBe("my-product");
  });
  it("rejects duplicate product slug within a store", async () => {
    const repo = new InMemoryCatalogRepository();
    const service = new CatalogService(
      repo,
      new AuditServiceStub() as unknown as AuditService,
    );
    await service.createProduct("user-1", "tenant-1", {
      tenantId: "tenant-1",
      storeId: "store-1",
      slug: "my-product",
      title: "My Product",
    });
    await expect(
      service.createProduct("user-1", "tenant-1", {
        tenantId: "tenant-1",
        storeId: "store-1",
        slug: "my-product",
        title: "Other Product",
      }),
    ).rejects.toThrow("Product slug already exists for store");
  });
  it("updates product metadata correctly", async () => {
    const repo = new InMemoryCatalogRepository();
    const service = new CatalogService(
      repo,
      new AuditServiceStub() as unknown as AuditService,
    );
    const product = await service.createProduct("user-1", "tenant-1", {
      tenantId: "tenant-1",
      storeId: "store-1",
      slug: "my-product",
      title: "My Product",
    });
    const updated = await service.updateProduct(
      "user-1",
      "tenant-1",
      product.id,
      { title: "Updated Product" },
    );
    expect(updated.title).toBe("Updated Product");
  });
  it("publishes product correctly", async () => {
    const repo = new InMemoryCatalogRepository();
    const service = new CatalogService(
      repo,
      new AuditServiceStub() as unknown as AuditService,
    );
    const product = await service.createProduct("user-1", "tenant-1", {
      tenantId: "tenant-1",
      storeId: "store-1",
      slug: "my-product",
      title: "My Product",
    });
    const updated = await service.updateProduct(
      "user-1",
      "tenant-1",
      product.id,
      { status: "PUBLISHED" },
    );
    expect(updated.status).toBe("PUBLISHED");
  });
  it("rejects cross-tenant product access", async () => {
    const repo = new InMemoryCatalogRepository();
    const service = new CatalogService(
      repo,
      new AuditServiceStub() as unknown as AuditService,
    );
    const product = await service.createProduct("user-1", "tenant-1", {
      tenantId: "tenant-1",
      storeId: "store-1",
      slug: "my-product",
      title: "My Product",
    });
    await expect(service.getProduct("tenant-2", product.id)).rejects.toThrow(
      "Cross-tenant access is not allowed",
    );
  });
});

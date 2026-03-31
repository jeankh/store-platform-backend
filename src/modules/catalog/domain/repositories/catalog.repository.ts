import {
  CategoryRecord,
  CollectionRecord,
  ProductRecord,
  ProductVariantRecord,
} from "../entities/catalog-records";

export type CreateProductInput = {
  tenantId: string;
  storeId: string;
  slug: string;
  title: string;
  description?: string | null;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  brandId?: string | null;
};

export type UpdateProductInput = {
  productId: string;
  slug?: string;
  title?: string;
  description?: string | null;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  brandId?: string | null;
};

export type CreateVariantInput = {
  productId: string;
  sku: string;
  title: string;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
};

export type CreateCategoryInput = {
  tenantId: string;
  storeId: string;
  slug: string;
  name: string;
  parentId?: string | null;
};

export type CreateCollectionInput = {
  tenantId: string;
  storeId: string;
  slug: string;
  name: string;
};

export type AttachProductToCollectionInput = {
  productId: string;
  collectionId: string;
};

export interface CatalogRepository {
  createProduct(input: CreateProductInput): Promise<ProductRecord>;
  listProducts(tenantId: string): Promise<ProductRecord[]>;
  findProductById(productId: string): Promise<ProductRecord | null>;
  findProductByStoreAndSlug(
    storeId: string,
    slug: string,
  ): Promise<ProductRecord | null>;
  updateProduct(input: UpdateProductInput): Promise<ProductRecord>;
  createVariant(input: CreateVariantInput): Promise<ProductVariantRecord>;
  listVariants(productId: string): Promise<ProductVariantRecord[]>;
  findVariantBySku(
    productId: string,
    sku: string,
  ): Promise<ProductVariantRecord | null>;
  updateVariantStatus(
    variantId: string,
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED",
  ): Promise<ProductVariantRecord>;
  createCategory(input: CreateCategoryInput): Promise<CategoryRecord>;
  listCategories(tenantId: string): Promise<CategoryRecord[]>;
  findCategoryByStoreAndSlug(
    storeId: string,
    slug: string,
  ): Promise<CategoryRecord | null>;
  createCollection(input: CreateCollectionInput): Promise<CollectionRecord>;
  listCollections(tenantId: string): Promise<CollectionRecord[]>;
  findCollectionByStoreAndSlug(
    storeId: string,
    slug: string,
  ): Promise<CollectionRecord | null>;
  attachProductToCollection(
    input: AttachProductToCollectionInput,
  ): Promise<void>;
  listPublishedProductsByStore(storeId: string): Promise<ProductRecord[]>;
  findPublishedProductByStoreAndSlug(
    storeId: string,
    slug: string,
  ): Promise<ProductRecord | null>;
}

export type ProductRecord = {
  id: string;
  tenantId: string;
  storeId: string;
  slug: string;
  title: string;
  description: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  brandId: string | null;
};

export type ProductVariantRecord = {
  id: string;
  productId: string;
  sku: string;
  title: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
};

export type CategoryRecord = {
  id: string;
  tenantId: string;
  storeId: string;
  slug: string;
  name: string;
  parentId: string | null;
};

export type CollectionRecord = {
  id: string;
  tenantId: string;
  storeId: string;
  slug: string;
  name: string;
};

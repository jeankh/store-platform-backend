export type ProductSearchDocument = {
  productId: string;
  tenantId: string;
  storeId: string;
  slug: string;
  title: string;
  description: string | null;
  status: "PUBLISHED";
  brand: string | null;
  categories: string[];
  collections: string[];
  tags: string[];
  createdAt: Date;
  defaultPrice: { currencyCode: string; amount: number } | null;
};

export type ProductSearchResult = {
  items: ProductSearchDocument[];
  total: number;
  page: number;
  pageSize: number;
};

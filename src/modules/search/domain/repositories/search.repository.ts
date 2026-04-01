import { ProductSearchResult } from "../entities/search-records";

export type SearchProductsInput = {
  storeId: string;
  query?: string;
  category?: string;
  collection?: string;
  page: number;
  pageSize: number;
  sortBy?: "title" | "createdAt";
  sortOrder?: "asc" | "desc";
};

export interface SearchRepository {
  searchProducts(input: SearchProductsInput): Promise<ProductSearchResult>;
  countPublishedProducts(): Promise<number>;
}

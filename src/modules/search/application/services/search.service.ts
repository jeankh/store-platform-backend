import { BadRequestException, Inject, Injectable } from "@nestjs/common";

import {
  SearchRepository,
  SearchProductsInput,
} from "../../domain/repositories/search.repository";
import { SEARCH_REPOSITORY } from "../../domain/repositories/search.repository.token";

@Injectable()
export class SearchService {
  constructor(
    @Inject(SEARCH_REPOSITORY) private readonly repository: SearchRepository,
  ) {}

  async searchProducts(input: {
    storeId: string;
    query?: string;
    category?: string;
    collection?: string;
    page?: number;
    pageSize?: number;
    sortBy?: "title" | "createdAt";
    sortOrder?: "asc" | "desc";
  }) {
    const page = input.page ?? 1;
    const pageSize = input.pageSize ?? 20;

    if (input.sortBy && !["title", "createdAt"].includes(input.sortBy)) {
      throw new BadRequestException("Unsupported sort field");
    }

    const payload: SearchProductsInput = {
      storeId: input.storeId,
      query: input.query,
      category: input.category,
      collection: input.collection,
      page,
      pageSize,
      sortBy: input.sortBy,
      sortOrder: input.sortOrder,
    };
    return this.repository.searchProducts(payload);
  }

  async reindexProducts() {
    const indexedProducts = await this.repository.countPublishedProducts();

    return {
      scope: "products",
      indexedProducts,
      status: "completed",
    };
  }

  async getIndexStatus() {
    const indexedProducts = await this.repository.countPublishedProducts();

    return {
      scope: "products",
      indexedProducts,
      status: "ready",
    };
  }
}

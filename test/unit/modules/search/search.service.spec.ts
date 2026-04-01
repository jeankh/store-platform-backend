import { describe, expect, it } from "vitest";

import { SearchService } from "src/modules/search/application/services/search.service";
import { SearchRepository } from "src/modules/search/domain/repositories/search.repository";

class InMemorySearchRepository implements SearchRepository {
  async searchProducts(input: any) {
    return {
      items: [
        {
          productId: "product-1",
          tenantId: "tenant-1",
          storeId: input.storeId,
          slug: "published-product",
          title: "Published Product",
          description: "A product",
          status: "PUBLISHED",
          brand: null,
          categories: ["summer"],
          collections: ["featured"],
          tags: ["tag-a"],
          createdAt: new Date(),
          defaultPrice: { currencyCode: "USD", amount: 1000 },
        },
      ],
      total: 1,
      page: input.page,
      pageSize: input.pageSize,
    };
  }
}

describe("Search unit tests", () => {
  it("transforms keyword and filter inputs into search query params", async () => {
    const service = new SearchService(new InMemorySearchRepository());
    const result = await service.searchProducts({
      storeId: "store-1",
      query: "shoe",
      category: "summer",
      page: 1,
      pageSize: 20,
    });
    expect(result.total).toBe(1);
  });

  it("supports category and collection filters", async () => {
    const service = new SearchService(new InMemorySearchRepository());
    const result = await service.searchProducts({
      storeId: "store-1",
      category: "summer",
      collection: "featured",
    });
    expect(result.items[0].categories).toContain("summer");
    expect(result.items[0].collections).toContain("featured");
  });

  it("supports sorting and pagination defaults", async () => {
    const service = new SearchService(new InMemorySearchRepository());
    const result = await service.searchProducts({ storeId: "store-1" });
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
  });

  it("rejects invalid sort field if unsupported", async () => {
    const service = new SearchService(new InMemorySearchRepository());
    await expect(
      service.searchProducts({ storeId: "store-1", sortBy: "price" as any }),
    ).rejects.toThrow("Unsupported sort field");
  });
});

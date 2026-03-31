import { Controller, Get, Inject, Param, Query } from "@nestjs/common";

import { CatalogService } from "../../../application/services/catalog.service";

@Controller("storefront")
export class StorefrontCatalogController {
  constructor(
    @Inject(CatalogService) private readonly catalogService: CatalogService,
  ) {}

  @Get("products")
  listProducts(@Query("storeId") storeId?: string) {
    return this.catalogService.listPublishedProducts(storeId || "");
  }

  @Get("products/:productSlug")
  getProduct(
    @Param("productSlug") productSlug: string,
    @Query("storeId") storeId?: string,
  ) {
    return this.catalogService.getPublishedProductBySlug(
      storeId || "",
      productSlug,
    );
  }

  @Get("categories")
  listCategories(@Query("tenantId") tenantId?: string) {
    return tenantId ? this.catalogService.listCategories(tenantId) : [];
  }

  @Get("collections")
  listCollections(@Query("tenantId") tenantId?: string) {
    return tenantId ? this.catalogService.listCollections(tenantId) : [];
  }
}

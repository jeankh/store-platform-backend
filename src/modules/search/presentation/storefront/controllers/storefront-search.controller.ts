import { Controller, Get, Inject, Query } from "@nestjs/common";

import { SearchService } from "../../../application/services/search.service";
import { SearchProductsQueryDto } from "../dto/search-products-query.dto";

@Controller("storefront/search")
export class StorefrontSearchController {
  constructor(
    @Inject(SearchService) private readonly searchService: SearchService,
  ) {}

  @Get("products")
  searchProducts(@Query() query: SearchProductsQueryDto) {
    return this.searchService.searchProducts(query);
  }
}

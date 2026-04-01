import { IsIn, IsInt, IsOptional, IsString, Min } from "class-validator";

export class SearchProductsQueryDto {
  @IsString()
  storeId!: string;

  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  collection?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  pageSize?: number;

  @IsOptional()
  @IsIn(["title", "createdAt"])
  sortBy?: "title" | "createdAt";

  @IsOptional()
  @IsIn(["asc", "desc"])
  sortOrder?: "asc" | "desc";
}

import { IsIn, IsOptional, IsString } from "class-validator";

export class CreateProductVariantDto {
  @IsString()
  sku!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsIn(["DRAFT", "PUBLISHED", "ARCHIVED"])
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
}

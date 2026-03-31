import { IsOptional, IsString } from "class-validator";

export class CreateCategoryDto {
  @IsString()
  tenantId!: string;

  @IsString()
  storeId!: string;

  @IsString()
  slug!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  parentId?: string | null;
}

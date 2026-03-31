import { IsOptional, IsString } from "class-validator";

export class CreateStoreDto {
  @IsString()
  slug!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  defaultLocale?: string;

  @IsOptional()
  @IsString()
  defaultCurrency?: string;
}

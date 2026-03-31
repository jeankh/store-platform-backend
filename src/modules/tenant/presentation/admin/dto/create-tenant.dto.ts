import { IsOptional, IsString } from "class-validator";

export class CreateTenantDto {
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

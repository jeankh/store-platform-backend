import { IsBoolean, IsOptional, IsString, Matches } from "class-validator";

export class UpdateStoreTaxConfigDto {
  @IsString()
  @Matches(/^[A-Z]{2}$/)
  countryCode!: string;

  @IsOptional()
  @IsString()
  regionCode?: string | null;

  @IsBoolean()
  taxInclusive!: boolean;

  @IsOptional()
  @IsString()
  taxProvider?: string | null;

  @IsOptional()
  @IsString()
  taxCalculationStrategy?: string | null;
}

import { IsOptional, IsString, Matches } from "class-validator";

export class CreateShippingZoneDto {
  @IsString()
  tenantId!: string;

  @IsString()
  storeId!: string;

  @IsString()
  name!: string;

  @IsString()
  @Matches(/^[A-Z]{2}$/)
  countryCode!: string;

  @IsOptional()
  @IsString()
  regionCode?: string | null;
}

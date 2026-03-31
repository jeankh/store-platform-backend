import { IsBoolean, IsOptional, IsString, Matches } from "class-validator";

export class CreateCustomerAddressDto {
  @IsOptional()
  @IsString()
  label?: string | null;

  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsOptional()
  @IsString()
  company?: string | null;

  @IsString()
  line1!: string;

  @IsOptional()
  @IsString()
  line2?: string | null;

  @IsString()
  city!: string;

  @IsOptional()
  @IsString()
  region?: string | null;

  @IsString()
  postalCode!: string;

  @IsString()
  @Matches(/^[A-Z]{2}$/)
  countryCode!: string;

  @IsOptional()
  @IsString()
  phone?: string | null;

  @IsOptional()
  @IsBoolean()
  isDefaultShipping?: boolean;

  @IsOptional()
  @IsBoolean()
  isDefaultBilling?: boolean;
}

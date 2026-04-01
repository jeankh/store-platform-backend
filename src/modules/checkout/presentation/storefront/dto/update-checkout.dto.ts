import { IsOptional, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

class CheckoutAddressDto {
  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

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
  countryCode!: string;

  @IsOptional()
  @IsString()
  phone?: string | null;
}

export class UpdateCheckoutDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => CheckoutAddressDto)
  shippingAddress?: CheckoutAddressDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CheckoutAddressDto)
  billingAddress?: CheckoutAddressDto;
}

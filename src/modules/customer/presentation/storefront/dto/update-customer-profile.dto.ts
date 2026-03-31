import { IsBoolean, IsEmail, IsOptional, IsString } from "class-validator";

export class UpdateCustomerProfileDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  phone?: string | null;

  @IsOptional()
  @IsString()
  localeCode?: string | null;

  @IsOptional()
  @IsString()
  currencyCode?: string | null;

  @IsOptional()
  @IsBoolean()
  marketingEmailOptIn?: boolean;

  @IsOptional()
  @IsBoolean()
  marketingSmsOptIn?: boolean;
}

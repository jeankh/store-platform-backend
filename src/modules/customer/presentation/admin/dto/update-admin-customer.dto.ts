import { IsBoolean, IsOptional, IsString } from "class-validator";

export class UpdateAdminCustomerDto {
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

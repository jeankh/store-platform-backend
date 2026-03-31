import { IsBoolean, IsOptional, IsString, Matches } from "class-validator";

export class AddStoreCurrencyDto {
  @IsString()
  @Matches(/^[A-Z]{3}$/)
  currencyCode!: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

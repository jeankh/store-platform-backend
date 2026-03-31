import { IsBoolean, IsOptional, IsString, Matches } from "class-validator";

export class AddStoreLocaleDto {
  @IsString()
  @Matches(/^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/)
  localeCode!: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

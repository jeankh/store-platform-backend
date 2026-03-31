import { IsEmail, IsOptional, IsString, Matches } from "class-validator";

export class UpdateStoreSettingsDto {
  @IsOptional()
  @IsString()
  displayName?: string | null;

  @IsOptional()
  @IsEmail()
  supportEmail?: string | null;

  @IsOptional()
  @IsString()
  supportPhone?: string | null;

  @IsOptional()
  @IsString()
  timezone?: string | null;

  @IsOptional()
  @IsString()
  logoUrl?: string | null;

  @IsOptional()
  @Matches(/^#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/)
  primaryColor?: string | null;

  @IsOptional()
  @Matches(/^#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/)
  secondaryColor?: string | null;
}

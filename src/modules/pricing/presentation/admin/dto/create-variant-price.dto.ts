import { IsInt, IsOptional, IsString, Min } from "class-validator";

export class CreateVariantPriceDto {
  @IsString()
  currencyCode!: string;

  @IsInt()
  @Min(0)
  amount!: number;
}

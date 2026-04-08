import { IsInt, IsString, Min } from "class-validator";

export class CreateShippingMethodDto {
  @IsString()
  tenantId!: string;

  @IsString()
  storeId!: string;

  @IsString()
  shippingZoneId!: string;

  @IsString()
  code!: string;

  @IsString()
  name!: string;

  @IsInt()
  @Min(0)
  amount!: number;

  @IsString()
  currencyCode!: string;
}

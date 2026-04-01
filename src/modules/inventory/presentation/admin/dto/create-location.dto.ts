import { IsString } from "class-validator";

export class CreateLocationDto {
  @IsString()
  tenantId!: string;

  @IsString()
  storeId!: string;

  @IsString()
  warehouseId!: string;

  @IsString()
  slug!: string;

  @IsString()
  name!: string;
}

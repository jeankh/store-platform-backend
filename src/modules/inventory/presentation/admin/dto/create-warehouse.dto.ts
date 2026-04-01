import { IsString } from "class-validator";

export class CreateWarehouseDto {
  @IsString()
  tenantId!: string;

  @IsString()
  storeId!: string;

  @IsString()
  slug!: string;

  @IsString()
  name!: string;
}

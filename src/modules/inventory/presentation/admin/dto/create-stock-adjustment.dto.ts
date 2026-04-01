import { IsInt, IsString } from "class-validator";

export class CreateStockAdjustmentDto {
  @IsString()
  locationId!: string;

  @IsInt()
  delta!: number;

  @IsString()
  reason!: string;
}

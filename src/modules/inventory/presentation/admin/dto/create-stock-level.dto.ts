import { IsInt, IsString, Min } from "class-validator";

export class CreateStockLevelDto {
  @IsString()
  locationId!: string;

  @IsInt()
  @Min(0)
  availableQuantity!: number;
}

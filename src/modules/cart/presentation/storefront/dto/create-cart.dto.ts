import { IsString } from "class-validator";

export class CreateCartDto {
  @IsString()
  tenantId!: string;

  @IsString()
  storeId!: string;
}

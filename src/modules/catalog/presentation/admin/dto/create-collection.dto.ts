import { IsString } from "class-validator";

export class CreateCollectionDto {
  @IsString()
  tenantId!: string;

  @IsString()
  storeId!: string;

  @IsString()
  slug!: string;

  @IsString()
  name!: string;
}

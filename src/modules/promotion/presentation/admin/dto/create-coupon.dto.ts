import { IsIn, IsInt, IsOptional, IsString, Min } from "class-validator";

export class CreateCouponDto {
  @IsString()
  tenantId!: string;

  @IsString()
  storeId!: string;

  @IsString()
  code!: string;

  @IsIn(["FIXED", "PERCENTAGE"])
  type!: "FIXED" | "PERCENTAGE";

  @IsInt()
  @Min(0)
  value!: number;

  @IsOptional()
  @IsIn(["ACTIVE", "INACTIVE"])
  status?: "ACTIVE" | "INACTIVE";

  @IsOptional()
  @IsString()
  startsAt?: string | null;

  @IsOptional()
  @IsString()
  endsAt?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  usageLimit?: number | null;
}

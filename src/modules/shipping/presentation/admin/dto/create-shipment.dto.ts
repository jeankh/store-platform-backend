import { IsOptional, IsString } from "class-validator";

export class CreateShipmentDto {
  @IsOptional()
  @IsString()
  shippingMethodId?: string | null;

  @IsOptional()
  @IsString()
  trackingNumber?: string | null;
}

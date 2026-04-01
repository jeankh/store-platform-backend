import { IsString } from "class-validator";

export class CreateCheckoutDto {
  @IsString()
  cartId!: string;
}

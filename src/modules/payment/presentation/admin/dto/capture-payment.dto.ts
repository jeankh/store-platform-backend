import { IsInt, Min } from "class-validator";

export class CapturePaymentDto {
  @IsInt()
  @Min(1)
  amount!: number;
}

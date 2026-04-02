import { IsIn } from "class-validator";

export class UpdateOrderStatusDto {
  @IsIn(["PENDING", "CONFIRMED", "CANCELLED", "FULFILLED"])
  status!: "PENDING" | "CONFIRMED" | "CANCELLED" | "FULFILLED";
}

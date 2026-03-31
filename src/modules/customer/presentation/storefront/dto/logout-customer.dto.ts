import { IsString } from "class-validator";

export class LogoutCustomerDto {
  @IsString()
  refreshToken!: string;
}

import { IsEmail, IsString, MinLength } from "class-validator";

export class LoginCustomerDto {
  @IsString()
  tenantId!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";

export class RegisterCustomerDto {
  @IsString()
  tenantId!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

import { ArrayNotEmpty, IsArray, IsString } from "class-validator";

export class CreateRoleDto {
  @IsString()
  name!: string;

  @IsString()
  code!: string;

  @IsArray()
  @ArrayNotEmpty()
  permissionCodes!: string[];
}

import { IsOptional, IsString } from "class-validator";

export class CreateTrackingEventDto {
  @IsString()
  status!: string;

  @IsOptional()
  @IsString()
  description?: string | null;
}

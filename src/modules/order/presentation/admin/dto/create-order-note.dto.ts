import { IsString } from "class-validator";

export class CreateOrderNoteDto {
  @IsString()
  content!: string;
}

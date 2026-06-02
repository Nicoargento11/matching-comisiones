import { IsString, Length } from 'class-validator';

export class CreateColumnaDto {
  @IsString()
  @Length(1, 50)
  nombre: string;
}

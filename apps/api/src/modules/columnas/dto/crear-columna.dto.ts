import { IsString, Length } from 'class-validator';

export class CrearColumnaDto {
  @IsString()
  @Length(1, 50)
  nombre: string;
}

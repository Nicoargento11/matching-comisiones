import { IsInt, IsPositive } from 'class-validator';

export class AddEstudianteDto {
  @IsInt()
  @IsPositive()
  id_usuario: number;
}

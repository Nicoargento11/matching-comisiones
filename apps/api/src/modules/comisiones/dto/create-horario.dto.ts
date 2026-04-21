import { IsInt, IsPositive, IsString, Matches } from 'class-validator';

export class CreateHorarioDto {
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  hora_inicio: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  hora_fin: string;

  @IsInt()
  numero_dia: number;

  @IsInt()
  @IsPositive()
  id_modalidad: number;
}

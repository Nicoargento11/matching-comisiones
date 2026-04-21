import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive, IsString, Matches } from 'class-validator';

export class CreateHorarioDto {
  @ApiProperty({ example: '08:00' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  hora_inicio: string;

  @ApiProperty({ example: '10:00' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  hora_fin: string;

  @ApiProperty({ example: 1, description: '1=Lunes, 2=Martes, ..., 6=Sábado' })
  @IsInt()
  numero_dia: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive()
  id_modalidad: number;

  @ApiProperty({ example: 1, required: false })
  @IsInt()
  @IsPositive()
  id_aula?: number;
}

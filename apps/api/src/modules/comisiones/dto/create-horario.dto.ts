import { ApiProperty } from '@nestjs/swagger';
import { FormatoClase } from '@prisma/client';
import { IsEnum, IsOptional, IsString, Matches } from 'class-validator';

export class CreateHorarioDto {
  @ApiProperty({ example: '08:00' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: '$property debe tener formato HH:mm y ser una hora válida (00:00 a 23:59)',
  })
  hora_inicio: string;

  @ApiProperty({ example: '10:00' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: '$property debe tener formato HH:mm y ser una hora válida (00:00 a 23:59)',
  })
  hora_fin: string;

  @ApiProperty({
    example: 'Lunes',
    description: 'Nombre del día (Lunes, Martes, ...)',
  })
  @IsString()
  nombre_dia: string;

  @ApiProperty({ example: 'PRESENCIAL', description: 'Nombre de la modalidad' })
  @IsString()
  nombre_modalidad: string;

  @ApiProperty({ example: 'TEORICO_PRACTICO', required: false })
  @IsEnum(FormatoClase)
  @IsOptional()
  formato?: FormatoClase;

  @ApiProperty({ example: 'Aula 101 - Edificio Central', required: false })
  @IsString()
  @IsOptional()
  nombre_aula?: string;
}

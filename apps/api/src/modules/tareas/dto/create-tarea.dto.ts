import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTareaDto {
  @ApiProperty({ example: 'Leer apuntes de Análisis' })
  @IsString()
  @IsNotEmpty()
  titulo: string;

  @ApiProperty({ enum: ['POR_HACER', 'EN_PROGRESO', 'COMPLETADO'], example: 'POR_HACER' })
  @IsEnum(['POR_HACER', 'EN_PROGRESO', 'COMPLETADO'])
  estado: string;

  @ApiProperty({ enum: ['BAJA', 'MEDIA', 'ALTA'], example: 'MEDIA' })
  @IsEnum(['BAJA', 'MEDIA', 'ALTA'])
  prioridad: string;

  @ApiPropertyOptional({ example: 'Fecha límite: viernes 30/05' })
  @IsOptional()
  @IsString()
  descripcion?: string;
}

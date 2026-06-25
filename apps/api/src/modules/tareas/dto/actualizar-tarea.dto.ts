import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ActualizarTareaDto {
  @ApiProperty({ example: 'Leer apuntes de Análisis' })
  @IsString()
  @IsNotEmpty()
  titulo: string;

  @ApiProperty({ enum: ['BAJA', 'MEDIA', 'ALTA'], example: 'MEDIA' })
  @IsEnum(['BAJA', 'MEDIA', 'ALTA'])
  prioridad: string;

  @ApiPropertyOptional({ example: 'Fecha límite: viernes 30/05' })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiPropertyOptional({ example: 90 })
  @IsOptional()
  @IsInt()
  estimacion_min?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  id_materia?: number;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsInt()
  id_evento?: number;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoEvento, OrigenEvento } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateEventoDto {
  @ApiProperty({ example: 'Parcial 1' })
  @IsString()
  titulo: string;

  @ApiPropertyOptional({ example: 'Temas: módulos 1 al 3' })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiProperty({ enum: TipoEvento, example: TipoEvento.PARCIAL })
  @IsEnum(TipoEvento)
  tipo_evento: TipoEvento;

  @ApiProperty({ example: '2026-06-15T08:00:00.000Z' })
  @IsDateString()
  fecha_inicio: string;

  @ApiProperty({ example: '2026-06-15T10:00:00.000Z' })
  @IsDateString()
  fecha_fin: string;

  @ApiProperty({ enum: OrigenEvento, example: OrigenEvento.PROFESOR })
  @IsEnum(OrigenEvento)
  origen: OrigenEvento;

  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive()
  id_usuario: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive()
  id_materia: number;
}

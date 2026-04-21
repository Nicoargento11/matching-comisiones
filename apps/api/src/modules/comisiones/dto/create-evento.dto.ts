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
  @IsString()
  titulo: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsEnum(TipoEvento)
  tipo_evento: TipoEvento;

  @IsDateString()
  fecha_inicio: string;

  @IsDateString()
  fecha_fin: string;

  @IsEnum(OrigenEvento)
  origen: OrigenEvento;

  @IsInt()
  @IsPositive()
  id_usuario: number;

  @IsInt()
  @IsPositive()
  id_materia: number;
}

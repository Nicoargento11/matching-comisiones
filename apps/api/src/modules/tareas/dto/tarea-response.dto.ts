import { Exclude, Expose, Type } from 'class-transformer';

@Exclude()
export class MateriaMiniDto {
  @Expose()
  id_materia: number;

  @Expose()
  nombre_materia: string;
}

@Exclude()
export class EventoMiniDto {
  @Expose()
  id_evento: number;

  @Expose()
  titulo: string;

  @Expose()
  tipo_evento: string;

  @Expose()
  fecha_inicio: string;
}

@Exclude()
export class TareaTableroResponseDto {
  @Expose()
  id_tarea: string;

  @Expose()
  titulo: string;

  @Expose()
  descripcion: string | null;

  @Expose()
  prioridad: string;

  @Expose()
  estado: string;

  @Expose()
  estimacion_min: number | null;

  @Expose()
  fecha_vencimiento: string | null;

  @Expose()
  @Type(() => MateriaMiniDto)
  materia: MateriaMiniDto | null;

  @Expose()
  @Type(() => EventoMiniDto)
  evento: EventoMiniDto | null;
}

import { plainToInstance } from 'class-transformer';
import { TareaTableroResponseDto } from './dto/tarea-response.dto';

export const ESTADO_A_COLUMNA: Record<string, string> = {
  POR_HACER: 'Por hacer',
  EN_PROGRESO: 'En progreso',
  COMPLETADO: 'Hecho',
};

export const COLUMNA_A_ESTADO: Record<string, string> = {
  'Por hacer': 'POR_HACER',
  'En progreso': 'EN_PROGRESO',
  Hecho: 'COMPLETADO',
  Completado: 'COMPLETADO',
};

export function mapearTareaTableroResponse(raw: {
  id_tarea: number;
  titulo: string;
  descripcion: string | null;
  prioridad: string;
  estimacion_min: number | null;
  fecha_vencimiento: Date | null;
  columna: { nombre: string };
  materia: { id_materia: number; nombre_materia: string } | null;
  evento: { id_evento: number; titulo: string; tipo_evento: string; fecha_inicio: Date } | null;
}): TareaTableroResponseDto {
  return plainToInstance(
    TareaTableroResponseDto,
    {
      id_tarea: raw.id_tarea.toString(),
      titulo: raw.titulo,
      descripcion: raw.descripcion,
      prioridad: raw.prioridad,
      estado: COLUMNA_A_ESTADO[raw.columna.nombre] ?? raw.columna.nombre,
      estimacion_min: raw.estimacion_min,
      fecha_vencimiento: raw.fecha_vencimiento?.toISOString() ?? null,
      materia: raw.materia,
      evento: raw.evento
        ? { ...raw.evento, fecha_inicio: raw.evento.fecha_inicio.toISOString() }
        : null,
    },
    { excludeExtraneousValues: true },
  );
}

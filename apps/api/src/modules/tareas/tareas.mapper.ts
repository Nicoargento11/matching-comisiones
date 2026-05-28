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
  columna: { nombre: string };
}): TareaTableroResponseDto {
  return plainToInstance(
    TareaTableroResponseDto,
    {
      id_tarea: raw.id_tarea.toString(),
      titulo: raw.titulo,
      descripcion: raw.descripcion,
      prioridad: raw.prioridad,
      estado: COLUMNA_A_ESTADO[raw.columna.nombre] ?? raw.columna.nombre,
    },
    { excludeExtraneousValues: true },
  );
}

import { api } from './api'
import type { ColumnaKanban } from '@/tipos'

const NOMBRE_A_ESTADO: Record<string, string> = {
  'Por hacer': 'POR_HACER',
  'En progreso': 'EN_PROGRESO',
  Hecho: 'COMPLETADO',
}

type ColumnaAPI = Omit<ColumnaKanban, 'identificador'>

function normalizar(col: ColumnaAPI): ColumnaKanban {
  return {
    ...col,
    identificador: col.es_global ? (NOMBRE_A_ESTADO[col.nombre] ?? col.nombre) : col.nombre,
  }
}

export const columnaServicio = {
  obtener: (token?: string): Promise<ColumnaKanban[]> =>
    api.get<ColumnaAPI[]>('/columnas', token).then((cols) => cols.map(normalizar)),

  crear: (nombre: string, token?: string): Promise<ColumnaKanban> =>
    api.post<ColumnaAPI>('/columnas', { nombre }, token).then(normalizar),

  eliminar: (idColumna: number, token?: string): Promise<void> =>
    api.delete(`/columnas/${idColumna}`, token),
}

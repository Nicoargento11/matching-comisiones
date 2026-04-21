// GET /comisiones/:id
import { api } from './api'
import { Comision } from '@/tipos'
import { colorPorMateria } from '@/lib/colores'

function agregarColor(c: any): Comision {
  return { ...c, materia: { ...c.materia, color: colorPorMateria(c.materia.id_materia) } }
}

export const comisionServicio = {
  obtenerTodas: () =>
    api.get<any[]>('/comisiones').then((cs) => cs.map(agregarColor)),

  obtenerPorId: (id: number) =>
    api.get<any>(`/comisiones/${id}`).then(agregarColor),
}

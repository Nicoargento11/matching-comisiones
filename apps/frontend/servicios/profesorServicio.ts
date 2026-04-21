import { api } from './api'
import { Comision } from '@/tipos'
import { colorPorMateria } from '@/lib/colores'

function agregarColor(c: any): Comision {
  return { ...c, materia: { ...c.materia, color: colorPorMateria(c.materia.id_materia) } }
}

export const profesorServicio = {
  obtenerComisiones: (idUsuario: number, token?: string) =>
    api.get<any[]>(`/profesores/${idUsuario}/comisiones`, token).then((cs) => cs.map(agregarColor)),

  obtenerComision: (idUsuario: number, token?: string) =>
    api.get<any>(`/profesores/${idUsuario}/comision`, token).then(agregarColor),
}

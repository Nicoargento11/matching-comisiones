// GET /profesores/:id_usuario/comisiones y /profesores/:id_usuario/comision
import { api } from './api'
import { Comision } from '@/tipos'
import { colorPorMateria } from '@/lib/colores'

function agregarColor(c: any): Comision {
  return { ...c, materia: { ...c.materia, color: colorPorMateria(c.materia.id_materia) } }
}

export const profesorServicio = {
  obtenerComisiones: (idUsuario: number) =>
    api.get<any[]>(`/profesores/${idUsuario}/comisiones`).then((cs) => cs.map(agregarColor)),

  obtenerComision: (idUsuario: number) =>
    api.get<any>(`/profesores/${idUsuario}/comision`).then(agregarColor),
}

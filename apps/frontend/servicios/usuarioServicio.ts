// GET /usuarios/:id y /usuarios/:id/comisiones
import { api } from './api'
import { Comision, Usuario } from '@/tipos'
import { colorPorMateria } from '@/lib/colores'

// el backend no devuelve color en materia — lo generamos en el frontend
function agregarColor(c: any): Comision {
  return { ...c, materia: { ...c.materia, color: colorPorMateria(c.materia.id_materia) } }
}

export const usuarioServicio = {
  obtenerIdPrimerEstudiante: () =>
    api.get<number>('/usuarios/mock/estudiante'),

  obtenerIdPrimerProfesor: () =>
    api.get<number>('/usuarios/mock/profesor'),

  obtenerPorId: (id: number) =>
    api.get<Usuario>(`/usuarios/${id}`),

  // el endpoint devuelve { estado, comision }[] — extraemos solo la comision
  obtenerComisiones: (id: number) =>
    api.get<{ estado: string; comision: any }[]>(`/usuarios/${id}/comisiones`)
      .then((data) => data.map((item) => agregarColor(item.comision))),
}

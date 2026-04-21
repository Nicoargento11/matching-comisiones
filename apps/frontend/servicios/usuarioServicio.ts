// GET /usuarios/:id y /usuarios/:id/comisiones
import { api } from './api'
import { Comision, Usuario } from '@/tipos'
import { colorPorMateria } from '@/lib/colores'

// el backend no devuelve color en materia — lo generamos en el frontend
function agregarColor(c: any): Comision {
  return { ...c, materia: { ...c.materia, color: colorPorMateria(c.materia.id_materia) } }
}

export const usuarioServicio = {
  obtenerPorId: (id: number, token?: string) =>
    api.get<Usuario>(`/usuarios/${id}`, token),

  // el endpoint devuelve { estado, comision }[] — extraemos solo la comision
  obtenerComisiones: (id: number, token?: string) =>
    api.get<{ estado: string; comision: any }[]>(`/usuarios/${id}/comisiones`, token)
      .then((data) => data.map((item) => agregarColor(item.comision))),
}

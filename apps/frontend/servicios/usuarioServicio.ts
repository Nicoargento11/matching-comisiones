// GET /usuarios/:id y /usuarios/:id/comisiones
import { api } from './api'
import { Comision, Materia, Usuario } from '@/tipos'
import { colorPorMateria } from '@/lib/colores'

type ComisionSinColor = Omit<Comision, 'materia'> & { materia: Omit<Materia, 'color'> }
type UsuarioConRoles = Usuario & { roles: { rol: { nombre_rol: string } }[] }

// el backend no devuelve color en materia — lo generamos en el frontend
function agregarColor(c: ComisionSinColor): Comision {
  return { ...c, materia: { ...c.materia, color: colorPorMateria(c.materia.id_materia) } }
}

export const usuarioServicio = {
  obtenerPorId: (id: number, token?: string) =>
    api.get<Usuario>(`/usuarios/${id}`, token),

  obtenerPorDni: (dni: number, token?: string) =>
    api.get<UsuarioConRoles>(`/usuarios/dni/${dni}`, token),

  // el endpoint devuelve { estado, comision }[] — extraemos solo la comision
  obtenerComisiones: (id: number, token?: string) =>
    api.get<{ estado: string; comision: ComisionSinColor }[]>(`/usuarios/${id}/comisiones`, token)
      .then((data) => data.map((item) => agregarColor(item.comision))),
}

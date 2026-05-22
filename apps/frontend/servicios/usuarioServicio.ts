// GET /usuarios/:id y /usuarios/:id/comisiones
import { api } from './api'
import { ComisionSinColor, Usuario } from '@/tipos'
import { agregarColor } from '@/lib/colores'

type UsuarioConRoles = Usuario & { roles: { rol: { nombre_rol: string } }[] }

export const usuarioServicio = {
  obtenerPorId: (id: number, token?: string) =>
    api.get<Usuario>(`/usuarios/${id}`, token),

  obtenerPorDni: (dni: number, token?: string) =>
    api.get<UsuarioConRoles>(`/usuarios/dni/${dni}`, token),

  // el endpoint devuelve { estado, comision }[] — solo mostramos las activas
  obtenerComisiones: (id: number, token?: string) =>
    api.get<{ estado: string; comision: ComisionSinColor }[]>(`/usuarios/${id}/comisiones`, token)
      .then((data) => data.filter((item) => item.estado === 'ACTIVO').map((item) => agregarColor(item.comision))),
}

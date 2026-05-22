// GET /usuarios/:id y /usuarios/:id/comisiones
import { api } from './api'
import { ComisionSinColor, ItemComisionConEstado, Usuario, UsuarioBusquedaPorDni } from '@/tipos'
import { agregarColor } from '@/lib/colores'

export const usuarioServicio = {
  obtenerPorId: (id: number, token?: string) =>
    api.get<Usuario>(`/usuarios/${id}`, token),

  obtenerPorDni: (dni: number, token?: string) =>
    api.get<UsuarioBusquedaPorDni>(`/usuarios/dni/${dni}`, token),

  // el endpoint devuelve { estado, comision }[] — solo mostramos las activas
  obtenerComisiones: (id: number, token?: string) =>
    api.get<{ estado: string; comision: ComisionSinColor }[]>(`/usuarios/${id}/comisiones`, token)
      .then((data) => data.filter((item) => item.estado === 'ACTIVO').map((item) => agregarColor(item.comision))),

  // devuelve todas las inscripciones con su estado, sin filtrar ni transformar
  obtenerComisionesConEstado: (id: number, token?: string) =>
    api.get<ItemComisionConEstado[]>(`/usuarios/${id}/comisiones`, token),
}

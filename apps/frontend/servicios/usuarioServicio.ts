import { api } from './api'
import { ComisionSinColor, ItemComisionConEstado, Usuario, UsuarioConRoles } from '@/tipos'
import { agregarColor } from '@/lib/colores'

export const usuarioServicio = {
  obtenerPorId: (id: number, token?: string) =>
    api.get<Usuario>(`/usuarios/${id}`, token),

  obtenerPorDni: (dni: number, token?: string) =>
    api.get<UsuarioConRoles>(`/usuarios/dni/${dni}`, token),

  obtenerComisiones: (id: number, token?: string) =>
    api.get<{ estado: string; comision: ComisionSinColor }[]>(`/estudiantes/${id}/comisiones`, token)
      .then((data) => data.filter((item) => item.estado === 'ACTIVO').map((item) => agregarColor(item.comision))),

  obtenerComisionesConEstado: (id: number, token?: string) =>
    api.get<ItemComisionConEstado[]>(`/estudiantes/${id}/comisiones`, token),

  // GET /usuarios/buscar?q=xxx[&id_comision=X]
  // Pendiente backend: búsqueda por nombre/apellido parcial (mínimo 3 chars)
  // Opcionalmente filtrado por comisión cuando se provee id_comision
  buscarParaMensajeria: (q: string, idComision?: number, token?: string): Promise<UsuarioConRoles[]> => {
    const params = new URLSearchParams({ q })
    if (idComision) params.set('id_comision', String(idComision))
    return api.get<UsuarioConRoles[]>(`/usuarios/buscar?${params.toString()}`, token)
  },
}

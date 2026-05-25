// Contrato con el backend — endpoints pendientes de implementar:
// GET   /notificaciones/usuario/:idUsuario  → Notificacion[]
// PATCH /notificaciones/:idNotificacion/leida
// PATCH /notificaciones/usuario/:idUsuario/leidas
import { api } from './api'
import type { Notificacion } from '@/tipos'

export const notificacionServicio = {
  obtenerPorUsuario: (idUsuario: number, token?: string): Promise<Notificacion[]> =>
    api.get(`/notificaciones/usuario/${idUsuario}`, token),

  marcarLeida: (idNotificacion: number, token?: string): Promise<void> =>
    api.patch(`/notificaciones/${idNotificacion}/leida`, {}, token),

  marcarTodasLeidas: (idUsuario: number, token?: string): Promise<void> =>
    api.patch(`/notificaciones/usuario/${idUsuario}/leidas`, {}, token),
}

// Contrato con el backend — endpoints pendientes de implementar:
// GET    /tareas/usuario/:idUsuario             → TareaTablero[]
// POST   /tareas                                → TareaTablero   body: CreateTareaData
// PATCH  /tareas/:idTarea/estado                → TareaTablero   body: { estado }
// DELETE /tareas/:idTarea                       → void
import { api } from './api'
import type { EstadoTarea, PrioridadTarea, TareaTablero } from '@/tipos'

type CreateTareaData = {
  titulo: string
  estado: EstadoTarea
  prioridad: PrioridadTarea
  descripcion?: string
}

export const tareaServicio = {
  obtenerPorUsuario: (idUsuario: number, token?: string): Promise<TareaTablero[]> =>
    api.get(`/tareas/usuario/${idUsuario}`, token),

  crear: (data: CreateTareaData, token?: string): Promise<TareaTablero> =>
    api.post('/tareas', data, token),

  actualizarEstado: (idTarea: string, estado: EstadoTarea, token?: string): Promise<TareaTablero> =>
    api.patch(`/tareas/${idTarea}/estado`, { estado }, token),

  eliminar: (idTarea: string, token?: string): Promise<void> =>
    api.delete(`/tareas/${idTarea}`, token),
}

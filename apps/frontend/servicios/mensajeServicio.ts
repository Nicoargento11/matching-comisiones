// GET y POST /mensajes
import { api } from './api'
import { Mensaje } from '@/tipos'

export const mensajeServicio = {
  obtenerConversacion: (idUsuarioA: number, idUsuarioB: number) =>
    api.get<Mensaje[]>(`/mensajes?usuario_a=${idUsuarioA}&usuario_b=${idUsuarioB}`),

  enviar: (idEmisor: number, idReceptor: number, contenido: string) =>
    api.post<Mensaje>('/mensajes', { id_usuario_emisor: idEmisor, id_usuario_receptor: idReceptor, contenido }),
}

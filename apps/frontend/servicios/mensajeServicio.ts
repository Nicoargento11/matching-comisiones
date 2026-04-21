import { api } from './api'
import { Conversacion, MensajeAPI } from '@/tipos'

export const mensajeServicio = {
  getMisConversaciones: (token: string) =>
    api.get<Conversacion[]>('/conversaciones/mis-conversaciones', token),

  getMensajes: (idConversacion: number, token: string) =>
    api.get<MensajeAPI[]>(`/mensajes/${idConversacion}`, token),

  enviar: (idConversacion: number, idEmisor: number, contenido: string, token: string) =>
    api.post<MensajeAPI>('/mensajes', { id_conversacion: idConversacion, id_usuario_emisor: idEmisor, contenido }, token),

  crearConversacion: (idUsuario1: number, idUsuario2: number, token: string) =>
    api.post<Conversacion>('/conversaciones', { id_usuario_1: idUsuario1, id_usuario_2: idUsuario2 }, token),
}

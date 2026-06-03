import type { Conversacion } from '@/tipos'

export function tieneNoLeidos(conv: Conversacion, yoId: number): boolean {
  const ultimo = conv.mensajes[0]
  if (!ultimo) return false
  if (ultimo.id_usuario_emisor === yoId) return false
  const miPart = conv.participantes.find((p) => p.usuario.id_usuario === yoId)
  if (!miPart?.ultimo_leido) return true
  return new Date(ultimo.creado_en) > new Date(miPart.ultimo_leido)
}

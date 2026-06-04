import { describe, it, expect } from 'vitest'
import { tieneNoLeidos } from './mensajeria'
import type { Conversacion } from '@/tipos'

function buildConversacion(overrides: Partial<Conversacion> = {}): Conversacion {
  return {
    id_conversacion: 1,
    creada_en: '2026-01-01T00:00:00.000Z',
    participantes: [],
    mensajes: [],
    ...overrides,
  }
}

describe('tieneNoLeidos', () => {
  it('retorna false cuando no hay mensajes', () => {
    const conv = buildConversacion({ mensajes: [] })
    expect(tieneNoLeidos(conv, 1)).toBe(false)
  })

  it('retorna false cuando el último mensaje es del propio usuario', () => {
    const conv = buildConversacion({
      mensajes: [{ id_usuario_emisor: 1, contenido: 'hola', creado_en: '2026-06-01T10:00:00.000Z' }],
    })
    expect(tieneNoLeidos(conv, 1)).toBe(false)
  })

  it('retorna true cuando hay mensaje de otro y el participante no tiene ultimo_leido', () => {
    const conv = buildConversacion({
      mensajes: [{ id_usuario_emisor: 2, contenido: 'hola', creado_en: '2026-06-01T10:00:00.000Z' }],
      participantes: [{ usuario: { id_usuario: 1, nombre_usuario: 'A', apellido_usuario: 'B' }, ultimo_leido: null }],
    })
    expect(tieneNoLeidos(conv, 1)).toBe(true)
  })

  it('retorna true cuando el mensaje es posterior al ultimo_leido', () => {
    const conv = buildConversacion({
      mensajes: [{ id_usuario_emisor: 2, contenido: 'hola', creado_en: '2026-06-02T10:00:00.000Z' }],
      participantes: [{
        usuario: { id_usuario: 1, nombre_usuario: 'A', apellido_usuario: 'B' },
        ultimo_leido: '2026-06-01T10:00:00.000Z',
      }],
    })
    expect(tieneNoLeidos(conv, 1)).toBe(true)
  })

  it('retorna false cuando el ultimo_leido es posterior al último mensaje', () => {
    const conv = buildConversacion({
      mensajes: [{ id_usuario_emisor: 2, contenido: 'hola', creado_en: '2026-06-01T10:00:00.000Z' }],
      participantes: [{
        usuario: { id_usuario: 1, nombre_usuario: 'A', apellido_usuario: 'B' },
        ultimo_leido: '2026-06-02T10:00:00.000Z',
      }],
    })
    expect(tieneNoLeidos(conv, 1)).toBe(false)
  })

  it('retorna true cuando el participante no existe en la lista (asume no leído)', () => {
    const conv = buildConversacion({
      mensajes: [{ id_usuario_emisor: 2, contenido: 'hola', creado_en: '2026-06-01T10:00:00.000Z' }],
      participantes: [{ usuario: { id_usuario: 99, nombre_usuario: 'X', apellido_usuario: 'Y' }, ultimo_leido: null }],
    })
    // yoId=1 no está en participantes → miPart undefined → !miPart?.ultimo_leido = true
    expect(tieneNoLeidos(conv, 1)).toBe(true)
  })
})

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  formatearHora,
  utcAHoraArg,
  utcAFechaArg,
  tiempoRelativo,
  utcAFechaArgDate,
  formatearFechaCorta,
} from './fechas'

// Fecha fija para tests deterministas: 2026-06-03 15:00 UTC = 2026-06-03 12:00 ART
const FECHA_FIJA = new Date('2026-06-03T15:00:00.000Z').getTime()

describe('formatearHora', () => {
  it('retorna una cadena con formato HH:MM', () => {
    const result = formatearHora('2026-06-03T15:00:00.000Z')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
    expect(result).toContain(':')
  })

  it('retorna el mismo resultado para el mismo timestamp', () => {
    const ts = '2026-06-03T15:00:00.000Z'
    expect(formatearHora(ts)).toBe(formatearHora(ts))
  })
})

describe('utcAHoraArg', () => {
  it('convierte UTC a hora argentina (UTC-3)', () => {
    // 15:00 UTC → 12:00 ART
    expect(utcAHoraArg('2026-06-03T15:00:00.000Z')).toBe('12:00')
  })

  it('rellena con cero los minutos y horas de un dígito', () => {
    // 03:05 UTC → 00:05 ART
    expect(utcAHoraArg('2026-06-03T03:05:00.000Z')).toBe('00:05')
  })

  it('maneja medianoche UTC → 21:00 del día anterior en ART', () => {
    // 00:00 UTC → 21:00 ART (del día anterior)
    expect(utcAHoraArg('2026-06-03T00:00:00.000Z')).toBe('21:00')
  })
})

describe('utcAFechaArg', () => {
  it('devuelve la fecha correcta en formato YYYY-MM-DD para ART', () => {
    // 2026-06-03T03:00 UTC = 2026-06-03T00:00 ART → misma fecha
    expect(utcAFechaArg('2026-06-03T03:00:00.000Z')).toBe('2026-06-03')
  })

  it('ajusta el día cuando UTC es antes de las 03:00 (medianoche ART)', () => {
    // 2026-06-03T01:00 UTC = 2026-06-02T22:00 ART → día anterior
    expect(utcAFechaArg('2026-06-03T01:00:00.000Z')).toBe('2026-06-02')
  })
})

describe('utcAFechaArgDate', () => {
  it('retorna un objeto Date a medianoche en zona ART', () => {
    const result = utcAFechaArgDate('2026-06-03T15:00:00.000Z')
    // 15:00 UTC → 12:00 ART → fecha 2026-06-03
    expect(result.getFullYear()).toBe(2026)
    expect(result.getMonth()).toBe(5) // junio = 5 (0-indexed)
    expect(result.getDate()).toBe(3)
    expect(result.getHours()).toBe(0)
    expect(result.getMinutes()).toBe(0)
  })
})

describe('tiempoRelativo', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(FECHA_FIJA)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('retorna "ahora mismo" para diferencias menores a 1 minuto', () => {
    const hace30s = new Date(FECHA_FIJA - 30_000).toISOString()
    expect(tiempoRelativo(hace30s)).toBe('ahora mismo')
  })

  it('retorna "hace N min" para diferencias en minutos', () => {
    const hace5min = new Date(FECHA_FIJA - 5 * 60_000).toISOString()
    expect(tiempoRelativo(hace5min)).toBe('hace 5 min')
  })

  it('retorna "hace 1 h" para 1 hora exacta', () => {
    const hace1h = new Date(FECHA_FIJA - 60 * 60_000).toISOString()
    expect(tiempoRelativo(hace1h)).toBe('hace 1 h')
  })

  it('retorna "hace N h" para diferencias en horas', () => {
    const hace3h = new Date(FECHA_FIJA - 3 * 60 * 60_000).toISOString()
    expect(tiempoRelativo(hace3h)).toBe('hace 3 h')
  })

  it('retorna "hace 1 día" (singular) para 1 día exacto', () => {
    const hace1d = new Date(FECHA_FIJA - 24 * 60 * 60_000).toISOString()
    expect(tiempoRelativo(hace1d)).toBe('hace 1 día')
  })

  it('retorna "hace N días" (plural) para más de 1 día', () => {
    const hace3d = new Date(FECHA_FIJA - 3 * 24 * 60 * 60_000).toISOString()
    expect(tiempoRelativo(hace3d)).toBe('hace 3 días')
  })
})

describe('formatearFechaCorta', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(FECHA_FIJA)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('retorna "Hoy" para una fecha del mismo día', () => {
    // Mismo día que FECHA_FIJA en zona local
    const mismodia = new Date(FECHA_FIJA - 2 * 60 * 60_000).toISOString()
    expect(formatearFechaCorta(mismodia)).toBe('Hoy')
  })

  it('retorna "Ayer" para una fecha del día anterior', () => {
    const ayer = new Date(FECHA_FIJA - 24 * 60 * 60_000).toISOString()
    expect(formatearFechaCorta(ayer)).toBe('Ayer')
  })

  it('retorna string con fecha para días más antiguos', () => {
    const antiguo = '2026-01-15T12:00:00.000Z'
    const result = formatearFechaCorta(antiguo)
    // Verificamos que no es "Hoy" ni "Ayer", y tiene contenido
    expect(result).not.toBe('Hoy')
    expect(result).not.toBe('Ayer')
    expect(result.length).toBeGreaterThan(0)
  })
})

import { describe, it, expect } from 'vitest'
import { colorPorMateria, agregarColor } from './colores'

describe('colorPorMateria', () => {
  it('retorna un string hexadecimal para id 0', () => {
    const color = colorPorMateria(0)
    expect(typeof color).toBe('string')
    expect(color).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it('retorna el mismo color para el mismo id', () => {
    expect(colorPorMateria(3)).toBe(colorPorMateria(3))
  })

  it('aplica módulo: id 8 produce el mismo color que id 0 (paleta de 8)', () => {
    expect(colorPorMateria(8)).toBe(colorPorMateria(0))
  })

  it('retorna colores distintos para ids consecutivos dentro del rango', () => {
    expect(colorPorMateria(0)).not.toBe(colorPorMateria(1))
  })
})

describe('agregarColor', () => {
  it('agrega el campo color a la materia de la comisión', () => {
    const input = {
      id_comision: 1,
      materia: { id_materia: 2, nombre_materia: 'Matemática' },
    } as any

    const result = agregarColor(input)

    expect(result.materia.color).toBe(colorPorMateria(2))
    expect(result.materia.nombre_materia).toBe('Matemática')
  })

  it('preserva los demás campos de la comisión', () => {
    const input = {
      id_comision: 7,
      numero_comision: 3,
      materia: { id_materia: 0, nombre_materia: 'Física' },
    } as any

    const result = agregarColor(input)

    expect(result.id_comision).toBe(7)
    expect(result.numero_comision).toBe(3)
  })

  it('no muta el objeto original', () => {
    const input = { id_comision: 1, materia: { id_materia: 0, nombre_materia: 'Física' } } as any

    agregarColor(input)

    expect((input.materia as any).color).toBeUndefined()
  })
})

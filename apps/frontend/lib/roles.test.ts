import { describe, it, expect } from 'vitest'
import { obtenerRol, esEstudiante } from './roles'

describe('obtenerRol', () => {
  it('retorna null cuando roles es undefined', () => {
    expect(obtenerRol(undefined)).toBeNull()
  })

  it('retorna null cuando el array está vacío', () => {
    expect(obtenerRol([])).toBeNull()
  })

  it('retorna "Profe" cuando el usuario tiene rol profesor', () => {
    expect(obtenerRol([{ nombre_rol: 'profesor' }])).toBe('Profe')
  })

  it('retorna "Alumno" cuando el usuario tiene rol estudiante', () => {
    expect(obtenerRol([{ nombre_rol: 'estudiante' }])).toBe('Alumno')
  })

  it('retorna "Profe" cuando tiene ambos roles (profesor tiene precedencia)', () => {
    expect(obtenerRol([{ nombre_rol: 'estudiante' }, { nombre_rol: 'profesor' }])).toBe('Profe')
  })

  it('retorna null cuando el rol no es ni profesor ni estudiante', () => {
    expect(obtenerRol([{ nombre_rol: 'admin' }])).toBeNull()
  })

  it('retorna null cuando nombre_rol es undefined en todos los elementos', () => {
    expect(obtenerRol([{}, {}])).toBeNull()
  })
})

describe('esEstudiante', () => {
  it('retorna false cuando roles es undefined', () => {
    expect(esEstudiante(undefined)).toBe(false)
  })

  it('retorna false cuando el array está vacío', () => {
    expect(esEstudiante([])).toBe(false)
  })

  it('retorna true cuando tiene rol estudiante', () => {
    expect(esEstudiante([{ nombre_rol: 'estudiante' }])).toBe(true)
  })

  it('retorna false cuando tiene solo rol profesor', () => {
    expect(esEstudiante([{ nombre_rol: 'profesor' }])).toBe(false)
  })

  it('retorna true cuando tiene ambos roles', () => {
    expect(esEstudiante([{ nombre_rol: 'profesor' }, { nombre_rol: 'estudiante' }])).toBe(true)
  })
})

import { api } from './api'
import { ComisionSinColor } from '@/tipos'
import { agregarColor } from '@/lib/colores'

export const profesorServicio = {
  obtenerComisiones: (idUsuario: number, token?: string) =>
    api.get<ComisionSinColor[]>(`/profesores/${idUsuario}/comisiones`, token).then((cs) => cs.map(agregarColor)),

  obtenerComision: (idUsuario: number, token?: string) =>
    api.get<ComisionSinColor>(`/profesores/${idUsuario}/comision`, token).then(agregarColor),
}

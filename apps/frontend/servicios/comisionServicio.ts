import { api } from './api'
import { Comision, Horario, Evento } from '@/tipos'
import { colorPorMateria } from '@/lib/colores'

function agregarColor(c: any): Comision {
  return { ...c, materia: { ...c.materia, color: colorPorMateria(c.materia.id_materia) } }
}

export const comisionServicio = {
  obtenerTodas: (token?: string) =>
    api.get<any[]>('/comisiones', token).then((cs) => cs.map(agregarColor)),

  obtenerPorId: (id: number, token?: string) =>
    api.get<any>(`/comisiones/${id}`, token).then(agregarColor),

  agregarEstudiante: (idComision: number, idUsuario: number, token?: string) =>
    api.post<void>(`/comisiones/${idComision}/estudiantes`, { id_usuario: idUsuario }, token),

  darBajaEstudiante: (idComision: number, idUsuario: number, token?: string) =>
    api.delete<void>(`/comisiones/${idComision}/estudiantes/${idUsuario}`, token),

  agregarHorario: (idComision: number, datos: {
    hora_inicio: string
    hora_fin: string
    nombre_dia: string
    nombre_modalidad: string
    formato: string
    nombre_aula?: string
  }, token?: string) =>
    api.post<Horario>(`/comisiones/${idComision}/horarios`, datos, token),

  eliminarHorario: (idComision: number, idHorario: number, token?: string) =>
    api.delete<void>(`/comisiones/${idComision}/horarios/${idHorario}`, token),

  reactivarHorario: (idComision: number, idHorario: number, token?: string) =>
    api.patch<Horario>(`/comisiones/${idComision}/horarios/${idHorario}/reactivar`, {}, token),

  agregarEvento: (idComision: number, datos: {
    titulo: string
    tipo_evento: string
    fecha_inicio: string
    fecha_fin: string
    origen: string
    id_usuario: number
    id_materia: number
  }, token?: string) =>
    api.post<Evento>(`/comisiones/${idComision}/eventos`, datos, token),

  modificarEvento: (idComision: number, idEvento: number, datos: Partial<{
    titulo: string
    tipo_evento: string
    fecha_inicio: string
    fecha_fin: string
  }>, token?: string) =>
    api.patch<Evento>(`/comisiones/${idComision}/eventos/${idEvento}`, datos, token),

  eliminarEvento: (idComision: number, idEvento: number, token?: string) =>
    api.delete<void>(`/comisiones/${idComision}/eventos/${idEvento}`, token),

  reactivarEvento: (idComision: number, idEvento: number, token?: string) =>
    api.patch<Evento>(`/comisiones/${idComision}/eventos/${idEvento}/reactivar`, {}, token),
}

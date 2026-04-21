import { api } from './api'
import { Comision, Horario, Evento } from '@/tipos'
import { colorPorMateria } from '@/lib/colores'

function agregarColor(c: any): Comision {
  return { ...c, materia: { ...c.materia, color: colorPorMateria(c.materia.id_materia) } }
}

export const comisionServicio = {
  obtenerTodas: () =>
    api.get<any[]>('/comisiones').then((cs) => cs.map(agregarColor)),

  obtenerPorId: (id: number) =>
    api.get<any>(`/comisiones/${id}`).then(agregarColor),

  agregarEstudiante: (idComision: number, idUsuario: number) =>
    api.post<void>(`/comisiones/${idComision}/estudiantes`, { id_usuario: idUsuario }),

  agregarHorario: (idComision: number, datos: {
    hora_inicio: string
    hora_fin: string
    nombre_dia: string
    nombre_modalidad: string
    formato: string
  }) =>
    api.post<Horario>(`/comisiones/${idComision}/horarios`, datos),

  eliminarHorario: (idComision: number, idHorario: number) =>
    api.delete<void>(`/comisiones/${idComision}/horarios/${idHorario}`),

  agregarEvento: (idComision: number, datos: {
    titulo: string
    tipo_evento: string
    fecha_inicio: string
    fecha_fin: string
    origen: string
    id_usuario: number
    id_materia: number
  }) =>
    api.post<Evento>(`/comisiones/${idComision}/eventos`, datos),

  eliminarEvento: (idComision: number, idEvento: number) =>
    api.delete<void>(`/comisiones/${idComision}/eventos/${idEvento}`),
}

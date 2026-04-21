// datos de prueba para desarrollo - reemplazar con llamadas a la API de NestJS
import {
  Comision, EstadoInscripcion, FormatoClase, Mensaje,
  OrigenEvento, PerfilEstudiante, Profesor, TipoEvento,
  Usuario, UsuarioMensajeria,
} from '@/tipos'
import { colorPorMateria } from '@/lib/colores'

export const usuariosMock: Usuario[] = [
  { id_usuario: 1, nombre_usuario: 'Maria', apellido_usuario: 'Gonzalez', dni: 38111222, correo: 'maria.gonzalez@uni.edu.ar', activo: true },
  { id_usuario: 2, nombre_usuario: 'Lucas', apellido_usuario: 'Perez', dni: 39222333, correo: 'lucas.perez@uni.edu.ar', activo: true },
  { id_usuario: 3, nombre_usuario: 'Sofia', apellido_usuario: 'Lopez', dni: 40333444, correo: 'sofia.lopez@uni.edu.ar', activo: true },
  { id_usuario: 4, nombre_usuario: 'Tomas', apellido_usuario: 'Fernandez', dni: 41444555, correo: 'tomas.fernandez@uni.edu.ar', activo: true },
]

export const profesoresMock: Profesor[] = [
  { id_usuario: 5, nombre_usuario: 'Carlos', apellido_usuario: 'Martinez', correo: 'c.martinez@uni.edu.ar' },
  { id_usuario: 6, nombre_usuario: 'Ana', apellido_usuario: 'Rodriguez', correo: 'a.rodriguez@uni.edu.ar' },
  { id_usuario: 7, nombre_usuario: 'Roberto', apellido_usuario: 'Silva', correo: 'r.silva@uni.edu.ar' },
]

export const comisionesMock: Comision[] = [
  {
    id_comision: 1,
    numero_comision: 1,
    cupo_maximo: 30,
    materia: { id_materia: 1, nombre_materia: 'Ingenieria de Software II', color: colorPorMateria(1) },
    profesor: profesoresMock[0],
    horarios: [
      {
        id_horario_comision: 1,
        hora_inicio: '08:00', hora_fin: '10:00',
        formato: 'TEORICO' as FormatoClase,
        dia: { numero_dia: 1, nombre_dia: 'Lunes' },
        modalidad: { id_modalidad: 1, nombre_modalidad: 'presencial' },
        aula: { id_aula: 1, nombre: 'Aula 101' },
      },
      {
        id_horario_comision: 2,
        hora_inicio: '14:00', hora_fin: '16:00',
        formato: 'PRACTICO' as FormatoClase,
        dia: { numero_dia: 3, nombre_dia: 'Miercoles' },
        modalidad: { id_modalidad: 3, nombre_modalidad: 'hibrido' },
        aula: null,
      },
    ],
    eventos: [
      {
        id_evento: 1, titulo: 'Parcial 1er Cuatrimestre',
        tipo_evento: 'PARCIAL' as TipoEvento,
        fecha_inicio: '2025-05-12T08:00:00', fecha_fin: '2025-05-12T10:00:00',
        origen: 'PROFESOR' as OrigenEvento, id_materia: 1, id_comision: 1,
      },
      {
        id_evento: 2, titulo: 'Entrega TP Integrador',
        tipo_evento: 'ENTREGA_TP' as TipoEvento,
        fecha_inicio: '2025-06-02T23:59:00', fecha_fin: '2025-06-02T23:59:00',
        origen: 'PROFESOR' as OrigenEvento, id_materia: 1, id_comision: 1,
      },
    ],
    usuarios: usuariosMock.map((u) => ({
      estado: 'ACTIVO' as EstadoInscripcion,
      usuario: { id_usuario: u.id_usuario, nombre_usuario: u.nombre_usuario, apellido_usuario: u.apellido_usuario, correo: u.correo },
    })),
  },
  {
    id_comision: 2,
    numero_comision: 3,
    cupo_maximo: 25,
    materia: { id_materia: 2, nombre_materia: 'Matematica Discreta', color: colorPorMateria(2) },
    profesor: profesoresMock[1],
    horarios: [
      {
        id_horario_comision: 3,
        hora_inicio: '10:00', hora_fin: '12:00',
        formato: 'TEORICO' as FormatoClase,
        dia: { numero_dia: 2, nombre_dia: 'Martes' },
        modalidad: { id_modalidad: 2, nombre_modalidad: 'virtual' },
        aula: null,
      },
      {
        id_horario_comision: 4,
        hora_inicio: '10:00', hora_fin: '12:00',
        formato: 'PRACTICO' as FormatoClase,
        dia: { numero_dia: 4, nombre_dia: 'Jueves' },
        modalidad: { id_modalidad: 2, nombre_modalidad: 'virtual' },
        aula: null,
      },
    ],
    eventos: [
      {
        id_evento: 3, titulo: 'Parcial de Algebra',
        tipo_evento: 'PARCIAL' as TipoEvento,
        fecha_inicio: '2025-05-20T10:00:00', fecha_fin: '2025-05-20T12:00:00',
        origen: 'PROFESOR' as OrigenEvento, id_materia: 2, id_comision: 2,
      },
    ],
    usuarios: usuariosMock.slice(0, 2).map((u) => ({
      estado: 'ACTIVO' as EstadoInscripcion,
      usuario: { id_usuario: u.id_usuario, nombre_usuario: u.nombre_usuario, apellido_usuario: u.apellido_usuario, correo: u.correo },
    })),
  },
  {
    id_comision: 3,
    numero_comision: 2,
    cupo_maximo: 20,
    materia: { id_materia: 3, nombre_materia: 'Arquitectura de Computadoras', color: colorPorMateria(3) },
    profesor: profesoresMock[2],
    horarios: [
      {
        id_horario_comision: 5,
        hora_inicio: '16:00', hora_fin: '18:00',
        formato: 'TEORICO_PRACTICO' as FormatoClase,
        dia: { numero_dia: 5, nombre_dia: 'Viernes' },
        modalidad: { id_modalidad: 1, nombre_modalidad: 'presencial' },
        aula: { id_aula: 2, nombre: 'Lab 1' },
      },
    ],
    eventos: [],
    usuarios: usuariosMock.slice(1, 4).map((u) => ({
      estado: 'ACTIVO' as EstadoInscripcion,
      usuario: { id_usuario: u.id_usuario, nombre_usuario: u.nombre_usuario, apellido_usuario: u.apellido_usuario, correo: u.correo },
    })),
  },
  {
    id_comision: 4,
    numero_comision: 1,
    cupo_maximo: 30,
    materia: { id_materia: 4, nombre_materia: 'Base de Datos', color: colorPorMateria(4) },
    profesor: profesoresMock[0],
    horarios: [
      {
        id_horario_comision: 7,
        hora_inicio: '14:00', hora_fin: '16:00',
        formato: 'TEORICO_PRACTICO' as FormatoClase,
        dia: { numero_dia: 1, nombre_dia: 'Lunes' },
        modalidad: { id_modalidad: 3, nombre_modalidad: 'hibrido' },
        aula: null,
      },
    ],
    eventos: [],
    usuarios: usuariosMock.map((u) => ({
      estado: 'ACTIVO' as EstadoInscripcion,
      usuario: { id_usuario: u.id_usuario, nombre_usuario: u.nombre_usuario, apellido_usuario: u.apellido_usuario, correo: u.correo },
    })),
  },
]

export const perfilEstudianteMock: PerfilEstudiante = {
  usuario: usuariosMock[0],
  comisiones: comisionesMock,
}

export function buscarComisionPorId(id: number): Comision | undefined {
  return comisionesMock.find((c) => c.id_comision === id)
}

export function buscarComisionesPorProfesor(idUsuario: number): Comision[] {
  return comisionesMock.filter((c) => c.profesor.id_usuario === idUsuario)
}

// ─── MENSAJERIA ──────────────────────────────────────────────────────────────

export const todosLosUsuarios: UsuarioMensajeria[] = [
  ...usuariosMock.map((u) => ({
    id_usuario: u.id_usuario,
    nombre_usuario: u.nombre_usuario,
    apellido_usuario: u.apellido_usuario,
    rol: 'estudiante' as const,
  })),
  ...profesoresMock.map((p) => ({
    id_usuario: p.id_usuario,
    nombre_usuario: p.nombre_usuario,
    apellido_usuario: p.apellido_usuario,
    rol: 'profesor' as const,
  })),
]

export function claveConversacion(idA: number, idB: number): string {
  return [idA, idB].sort((a, b) => a - b).join('---')
}

export function buscarUsuarioPorId(id: number): UsuarioMensajeria | undefined {
  return todosLosUsuarios.find((u) => u.id_usuario === id)
}

export const conversacionesMockInicial: Record<string, Mensaje[]> = {
  '1---5': [
    { id_mensaje: 1, id_usuario_emisor: 5, contenido: 'Hola Maria recuerda entregar el TP integrador antes del viernes', creado_en: '2025-04-18T10:00:00' },
    { id_mensaje: 2, id_usuario_emisor: 1, contenido: 'Hola profesor si lo tengo casi listo solo me falta la parte de pruebas', creado_en: '2025-04-18T10:05:00' },
    { id_mensaje: 3, id_usuario_emisor: 5, contenido: 'Perfecto cualquier duda me consultas', creado_en: '2025-04-18T10:07:00' },
  ],
  '1---2': [
    { id_mensaje: 4, id_usuario_emisor: 2, contenido: 'Che viste lo del parcial de IS2 cuando es exactamente?', creado_en: '2025-04-17T15:00:00' },
    { id_mensaje: 5, id_usuario_emisor: 1, contenido: 'Si el 12 de mayo segun el profe Martinez a las 8', creado_en: '2025-04-17T15:10:00' },
    { id_mensaje: 6, id_usuario_emisor: 2, contenido: 'Gracias! Nos juntamos a estudiar la semana que viene?', creado_en: '2025-04-17T15:12:00' },
    { id_mensaje: 7, id_usuario_emisor: 1, contenido: 'Si dale el jueves despues de clase', creado_en: '2025-04-17T15:15:00' },
  ],
  '1---3': [
    { id_mensaje: 8, id_usuario_emisor: 3, contenido: 'Maria tenes los apuntes de la teorica del lunes?', creado_en: '2025-04-16T20:00:00' },
    { id_mensaje: 9, id_usuario_emisor: 1, contenido: 'Si te los mando por aqui cuando los pase en limpio', creado_en: '2025-04-16T20:05:00' },
  ],
}

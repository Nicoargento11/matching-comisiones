// enums del backend
export type TipoEvento = 'CLASE' | 'PARCIAL' | 'ENTREGA_TP' | 'OTRO'
export type OrigenEvento = 'PROFESOR' | 'ALUMNO' | 'SISTEMA'
export type EstadoInscripcion = 'ACTIVO' | 'BAJA' | 'PENDIENTE'
export type FormatoClase = 'TEORICO' | 'PRACTICO' | 'TEORICO_PRACTICO'

export interface Usuario {
  id_usuario: number
  nombre_usuario: string
  apellido_usuario: string
  dni: number
  correo: string
  activo: boolean
}

// el profesor es un usuario — esta interfaz refleja lo que devuelve
// el campo `profesor` dentro de una comision
export interface Profesor {
  id_usuario: number
  nombre_usuario: string
  apellido_usuario: string
  correo: string
}

export interface Materia {
  id_materia: number
  nombre_materia: string
  // generado en el frontend a partir de id_materia, no viene del backend
  color: string
}

export interface Dia {
  numero_dia: number
  nombre_dia: string
}

export interface Modalidad {
  id_modalidad: number
  nombre_modalidad: string
}

export interface Aula {
  id_aula: number
  nombre: string
}

export interface Horario {
  id_horario_comision: number
  hora_inicio: string // formato HH:mm
  hora_fin: string   // formato HH:mm
  formato: FormatoClase
  activo: boolean
  dia: Dia
  modalidad: Modalidad
  aula: Aula | null
}

export interface Evento {
  id_evento: number
  titulo: string
  descripcion?: string
  tipo_evento: TipoEvento
  fecha_inicio: string // ISO datetime
  fecha_fin: string   // ISO datetime
  origen: OrigenEvento
  activo: boolean
  id_materia: number
  id_comision: number
}

export interface UsuarioInComision {
  estado: EstadoInscripcion
  usuario: {
    id_usuario: number
    nombre_usuario: string
    apellido_usuario: string
    correo: string
  }
}

export interface Comision {
  id_comision: number
  numero_comision?: number
  nombre_comision?: string
  cupo_maximo: number
  materia: Materia
  profesor: Profesor
  horarios: Horario[]
  eventos?: Evento[]
  usuarios?: UsuarioInComision[]
}

// lo que devuelve el backend: igual a Comision pero sin color en materia
// (color se genera en el frontend a partir de id_materia)
export type ComisionSinColor = Omit<Comision, 'materia'> & { materia: Omit<Materia, 'color'> }

// usuario generico para el sistema de mensajeria
export interface UsuarioMensajeria {
  id_usuario: number
  nombre_usuario: string
  apellido_usuario: string
  rol: 'estudiante' | 'profesor'
}

export interface Mensaje {
  id_mensaje: number
  id_usuario_emisor: number
  contenido: string
  creado_en: string // ISO datetime
}

export interface MensajeAPI {
  id_mensaje: number
  contenido: string
  creado_en: string
  emisor: {
    id_usuario: number
    nombre_usuario: string
    apellido_usuario: string
  }
}

export interface ParticipanteConversacion {
  ultimo_leido: string | null
  usuario: {
    id_usuario: number
    nombre_usuario: string
    apellido_usuario: string
    roles?: { rol?: { nombre_rol?: string } }[]
  }
}

export interface Conversacion {
  id_conversacion: number
  creada_en: string
  participantes: ParticipanteConversacion[]
  mensajes: {
    contenido: string
    creado_en: string
    id_usuario_emisor?: number
  }[]
}

export interface PerfilEstudiante {
  usuario: Usuario
  comisiones: Comision[]
}

export type UsuarioBusquedaPorDni = {
  id_usuario: number
  nombre_usuario: string
  apellido_usuario: string
  correo: string
  roles?: { id_rol?: number; nombre_rol?: string }[]
}

// GET /auth/me — misma estructura plana que UsuarioBusquedaPorDni
export type UsuarioPerfil = {
  id_usuario: number
  nombre_usuario: string
  apellido_usuario: string
  correo: string
  activo: boolean
  roles: { id_rol: number; nombre_rol: string }[]
}

export type ItemComisionConEstado = {
  estado: string
  comision: {
    id_comision: number
    numero_comision?: number | null
    nombre_comision?: string | null
    materia: { id_materia: number }
  }
}

export type ComisionConflicto = {
  id_comision: number
  numero_comision?: number | null
  nombre_comision?: string | null
}

export type TipoNotificacion = 'MATCHING_COMISION' | 'SISTEMA'

export type NotificacionDatos = {
  id_comision?: number
  nombre_comision?: string
  nombre_materia?: string
}

export interface Notificacion {
  id_notificacion: number
  tipo: TipoNotificacion
  titulo: string
  mensaje: string
  leida: boolean
  creada_en: string // ISO datetime
  datos?: NotificacionDatos
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginacionParams } from '../../../common/helpers/paginacion';

/** Select base para consultas de usuario: excluye `contrasena` */
const USUARIO_SELECT = {
  id_usuario: true,
  dni: true,
  nombre_usuario: true,
  apellido_usuario: true,
  correo: true,
  activo: true,
  fecha_registro: true,
  roles: { select: { rol: { select: { nombre_rol: true } } } },
} as const;

/** Select simplificado sin relaciones de roles */
const USUARIO_SELECT_SIN_ROLES = {
  id_usuario: true,
  dni: true,
  nombre_usuario: true,
  apellido_usuario: true,
  correo: true,
  activo: true,
  fecha_registro: true,
} as const;

/** Select mínimo para verificación de existencia */
const USUARIO_SELECT_MINIMO = {
  id_usuario: true,
} as const;

@Injectable()
export class UsuariosRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtiene un usuario por su id_usuario, incluyendo roles
   * @param idUsuario - ID del usuario a buscar
   * @returns Datos del usuario sin contrasena, o null si no existe
   */
  async obtenerPorId(idUsuario: number) {
    return this.prisma.usuario.findUnique({
      where: { id_usuario: idUsuario },
      select: USUARIO_SELECT,
    });
  }

  /**
   * Obtiene un usuario por su DNI, incluyendo roles
   * @param dni - DNI del usuario a buscar
   * @returns Datos del usuario sin contrasena, o null si no existe
   */
  async obtenerPorDni(dni: number) {
    return this.prisma.usuario.findUnique({
      where: { dni },
      select: USUARIO_SELECT,
    });
  }

  /**
   * Obtiene todos los usuarios sin incluir roles, con paginación
   * @param paginacion - Parámetros de paginación (skip, take, orderBy)
   * @returns Lista paginada de usuarios sin contrasena
   */
  async obtenerTodos(paginacion: PaginacionParams) {
    return this.prisma.usuario.findMany({
      select: USUARIO_SELECT_SIN_ROLES,
      ...paginacion,
    });
  }

  /**
   * Cuenta la cantidad total de usuarios registrados
   * @returns Número total de usuarios
   */
  async contar(): Promise<number> {
    return this.prisma.usuario.count();
  }

  /**
   * Verifica si existe un usuario por su id_usuario
   * @param idUsuario - ID del usuario a verificar
   * @returns Datos mínimos del usuario (solo id_usuario) o null
   */
  async verificarExistencia(idUsuario: number) {
    return this.prisma.usuario.findUnique({
      where: { id_usuario: idUsuario },
      select: USUARIO_SELECT_MINIMO,
    });
  }

  /**
   * Obtiene el id_usuario del primer estudiante registrado en usuarioComision
   * @returns ID del primer estudiante, o null si no hay
   */
  async obtenerPrimerEstudianteUsuarioId() {
    const estudiante = await this.prisma.usuarioComision.findFirst({
      select: { id_usuario: true },
    });
    return estudiante?.id_usuario ?? null;
  }

  /**
   * Obtiene el id_usuario_profesor de la primera comisión
   * @returns ID del primer profesor, o null si no hay
   */
  async obtenerPrimerProfesorUsuarioId() {
    const profesor = await this.prisma.comision.findFirst({
      select: { id_usuario_profesor: true },
    });
    return profesor?.id_usuario_profesor ?? null;
  }

  /**
   * Obtiene las comisiones en las que está inscrito un estudiante
   * @param idUsuario - ID del estudiante
   * @returns Lista de inscripciones con datos de comisión, horarios y eventos
   */
  async obtenerComisionesDeEstudiante(idUsuario: number) {
    return this.prisma.usuarioComision.findMany({
      where: { id_usuario: idUsuario },
      select: {
        estado: true,
        comision: {
          select: {
            id_comision: true,
            numero_comision: true,
            nombre_comision: true,
            cupo_maximo: true,
            materia: {
              select: { id_materia: true, nombre_materia: true },
            },
            profesor: {
              select: {
                id_usuario: true,
                nombre_usuario: true,
                apellido_usuario: true,
                correo: true,
              },
            },
            horarios: {
              where: { activo: true },
              select: {
                id_horario_comision: true,
                hora_inicio: true,
                hora_fin: true,
                formato: true,
                dia: { select: { numero_dia: true, nombre_dia: true } },
                modalidad: {
                  select: { id_modalidad: true, nombre_modalidad: true },
                },
                aula: { select: { id_aula: true, nombre: true } },
              },
            },
            eventos: {
              where: { activo: true },
              select: {
                id_evento: true,
                titulo: true,
                tipo_evento: true,
                fecha_inicio: true,
                fecha_fin: true,
                origen: true,
                id_materia: true,
                id_comision: true,
              },
              orderBy: { fecha_inicio: 'asc' as const },
            },
          },
        },
      },
    });
  }

  /**
   * Obtiene las conversaciones en las que participa un usuario
   * @param idUsuario - ID del usuario
   * @returns Lista de participaciones con datos de conversación y último mensaje
   */
  async obtenerConversaciones(idUsuario: number) {
    return this.prisma.conversacionParticipante.findMany({
      where: { id_usuario: idUsuario },
      select: {
        ultimo_leido: true,
        conversacion: {
          select: {
            id_conversacion: true,
            creada_en: true,
            participantes: {
              select: {
                usuario: {
                  select: {
                    id_usuario: true,
                    nombre_usuario: true,
                    apellido_usuario: true,
                  },
                },
              },
            },
            mensajes: {
              orderBy: { creado_en: 'desc' },
              take: 1,
              select: { contenido: true, creado_en: true },
            },
          },
        },
      },
    });
  }
}

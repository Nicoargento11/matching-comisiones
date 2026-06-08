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
  roles: { select: { rol: { select: { id_rol: true, nombre_rol: true } } } },
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


export abstract class UsuariosRepository {
  abstract obtenerPorId(idUsuario: number): ReturnType<PrismaUsuariosRepository['obtenerPorId']>;
  abstract obtenerPorDni(dni: number): ReturnType<PrismaUsuariosRepository['obtenerPorDni']>;
  abstract obtenerTodos(paginacion: PaginacionParams): ReturnType<PrismaUsuariosRepository['obtenerTodos']>;
  abstract contar(): Promise<number>;
  abstract obtenerPrimerEstudianteUsuarioId(): ReturnType<PrismaUsuariosRepository['obtenerPrimerEstudianteUsuarioId']>;
  abstract obtenerPrimerProfesorUsuarioId(): ReturnType<PrismaUsuariosRepository['obtenerPrimerProfesorUsuarioId']>;
  abstract buscarPorNombre(q: string, idUsuarioActual: number, idComision?: number): ReturnType<PrismaUsuariosRepository['buscarPorNombre']>;
}

@Injectable()
export class PrismaUsuariosRepository extends UsuariosRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

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
   * Busca usuarios por nombre o apellido, excluyendo al usuario actual
   * @param q - Texto a buscar (case-insensitive, partial match)
   * @param idUsuarioActual - ID del usuario que hace la consulta (excluido de resultados)
   * @param idComision - Si se provee, filtra a usuarios con inscripción ACTIVO en esa comisión
   * @returns Lista de hasta 15 usuarios con roles
   */
  async buscarPorNombre(q: string, idUsuarioActual: number, idComision?: number) {
    return this.prisma.usuario.findMany({
      where: {
        id_usuario: { not: idUsuarioActual },
        OR: [
          { nombre_usuario: { contains: q, mode: 'insensitive' } },
          { apellido_usuario: { contains: q, mode: 'insensitive' } },
        ],
        ...(idComision !== undefined && {
          comisiones: {
            some: { id_comision: idComision, estado: 'ACTIVO' },
          },
        }),
      },
      select: USUARIO_SELECT,
      take: 15,
    });
  }

}

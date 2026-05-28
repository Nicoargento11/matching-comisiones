import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginacionParams } from '../../../common/helpers/paginacion';
import { CreateEventoDto } from '../dto/create-evento.dto';
import { FormatoClase, Prisma } from '@prisma/client';

/** Select completo para consultas de comisión con relaciones */
export const COMISION_SELECT = {
  id_comision: true,
  numero_comision: true,
  nombre_comision: true,
  cupo_maximo: true,
  materia: { select: { id_materia: true, nombre_materia: true, color: true } },
  profesor: {
    select: {
      id_usuario: true,
      nombre_usuario: true,
      apellido_usuario: true,
      correo: true,
    },
  },
  horarios: {
    select: {
      id_horario_comision: true,
      hora_inicio: true,
      hora_fin: true,
      formato: true,
      activo: true,
      dia: { select: { numero_dia: true, nombre_dia: true } },
      modalidad: { select: { id_modalidad: true, nombre_modalidad: true } },
      aula: { select: { id_aula: true, nombre: true } },
    },
  },
  usuarios: {
    select: {
      estado: true,
      usuario: {
        select: {
          id_usuario: true,
          nombre_usuario: true,
          apellido_usuario: true,
          correo: true,
        },
      },
    },
  },
  eventos: {
    select: {
      id_evento: true,
      titulo: true,
      descripcion: true,
      tipo_evento: true,
      fecha_inicio: true,
      fecha_fin: true,
      origen: true,
      activo: true,
      id_materia: true,
      id_comision: true,
    },
    orderBy: { fecha_inicio: 'asc' as const },
  },
} as const;

/** Select para horario con relaciones */
const HORARIO_SELECT = {
  id_horario_comision: true,
  hora_inicio: true,
  hora_fin: true,
  formato: true,
  activo: true,
  dia: { select: { numero_dia: true, nombre_dia: true } },
  modalidad: { select: { id_modalidad: true, nombre_modalidad: true } },
  aula: { select: { id_aula: true, nombre: true } },
} as const;

@Injectable()
export class ComisionesRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtiene todas las comisiones con relaciones, con paginación
   * @param paginacion - Parámetros de paginación (skip, take, orderBy)
   * @returns Lista paginada de comisiones
   */
  async obtenerTodas(paginacion: PaginacionParams) {
    return this.prisma.comision.findMany({
      select: COMISION_SELECT,
      ...paginacion,
    });
  }

  /**
   * Cuenta la cantidad total de comisiones registradas
   * @returns Número total de comisiones
   */
  async contar(): Promise<number> {
    return this.prisma.comision.count();
  }

  /**
   * Obtiene una comisión por su ID con todas sus relaciones
   * @param idComision - ID de la comisión a buscar
   * @returns Datos completos de la comisión, o null si no existe
   */
  async obtenerPorId(idComision: number) {
    return this.prisma.comision.findUnique({
      where: { id_comision: idComision },
      select: COMISION_SELECT,
    });
  }

  /**
   * Verifica si existe una comisión por su ID
   * @param idComision - ID de la comisión a verificar
   * @returns La comisión encontrada, o null si no existe
   */
  async verificarExistencia(idComision: number) {
    return this.prisma.comision.findUnique({
      where: { id_comision: idComision },
      select: { id_comision: true, id_materia: true },
    });
  }

  /**
   * Obtiene el profesor asignado a una comisión (para verificación de autorización)
   * @param idComision - ID de la comisión
   * @returns El supabase_auth_id del profesor, o null si no existe la comisión
   */
  async buscarComisionConProfesor(idComision: number) {
    return this.prisma.comision.findUnique({
      where: { id_comision: idComision },
      select: {
        profesor: { select: { supabase_auth_id: true } },
      },
    });
  }

  /**
   * Verifica si existe un usuario por su ID
   * @param idUsuario - ID del usuario a verificar
   * @returns Datos mínimos del usuario (solo id_usuario) o null
   */
  async verificarExistenciaUsuario(idUsuario: number) {
    return this.prisma.usuario.findUnique({
      where: { id_usuario: idUsuario },
      select: { id_usuario: true },
    });
  }

  /**
   * Obtiene las comisiones de un usuario con su estado de inscripción
   * @param idUsuario - ID del usuario
   * @returns Lista de inscripciones con datos de comisión
   */
  async obtenerComisionesDeUsuario(idUsuario: number) {
    return this.prisma.usuarioComision.findMany({
      where: { id_usuario: idUsuario },
      select: {
        estado: true,
        comision: {
          select: COMISION_SELECT,
        },
      },
    });
  }

  /**
   * Busca una inscripción activa de un estudiante en una comisión
   * @param idUsuario - ID del usuario
   * @param idComision - ID de la comisión
   * @returns La inscripción existente, o null si no existe
   */
  async buscarInscripcion(idUsuario: number, idComision: number) {
    return this.prisma.usuarioComision.findUnique({
      where: {
        id_usuario_id_comision: {
          id_usuario: idUsuario,
          id_comision: idComision,
        },
      },
    });
  }

  /**
   * Reactiva una inscripción existente (cambia estado a ACTIVO)
   * @param idUsuario - ID del usuario
   * @param idComision - ID de la comisión
   * @returns La inscripción actualizada
   */
  async reactivarInscripcion(idUsuario: number, idComision: number) {
    return this.prisma.usuarioComision.update({
      where: {
        id_usuario_id_comision: {
          id_usuario: idUsuario,
          id_comision: idComision,
        },
      },
      data: { estado: 'ACTIVO' },
    });
  }

  /**
   * Crea una nueva inscripción de estudiante en una comisión
   * @param idUsuario - ID del usuario
   * @param idComision - ID de la comisión
   * @returns La inscripción creada
   */
  async crearInscripcion(idUsuario: number, idComision: number) {
    return this.prisma.usuarioComision.create({
      data: {
        id_usuario: idUsuario,
        id_comision: idComision,
        estado: 'ACTIVO',
      },
    });
  }

  /**
   * Da de baja (cambia estado a BAJA) la inscripción de un estudiante
   * @param idUsuario - ID del usuario
   * @param idComision - ID de la comisión
   */
  async darBajaInscripcion(idUsuario: number, idComision: number) {
    await this.prisma.usuarioComision.update({
      where: {
        id_usuario_id_comision: {
          id_usuario: idUsuario,
          id_comision: idComision,
        },
      },
      data: { estado: 'BAJA' },
    });
  }

  /**
   * Busca un día por su nombre (insensible a mayúsculas)
   * @param nombreDia - Nombre del día a buscar
   * @returns El día encontrado, o null si no existe
   */
  async buscarDiaPorNombre(nombreDia: string) {
    return this.prisma.dia.findFirst({
      where: { nombre_dia: { equals: nombreDia, mode: 'insensitive' } },
    });
  }

  /**
   * Busca una modalidad por su nombre (insensible a mayúsculas)
   * @param nombreModalidad - Nombre de la modalidad a buscar
   * @returns La modalidad encontrada, o null si no existe
   */
  async buscarModalidadPorNombre(nombreModalidad: string) {
    return this.prisma.modalidad.findFirst({
      where: {
        nombre_modalidad: { equals: nombreModalidad, mode: 'insensitive' },
      },
    });
  }

  /**
   * Crea un horario para una comisión dentro de una transacción
   * @param tx - Cliente de transacción Prisma
   * @param data - Datos del horario a crear
   * @returns El horario creado con relaciones
   */
  async crearHorario(
    tx: Prisma.TransactionClient,
    data: {
      hora_inicio: string;
      hora_fin: string;
      numero_dia: number;
      id_modalidad: number;
      formato: FormatoClase;
      id_comision: number;
      id_aula?: number;
    },
  ) {
    return tx.horarioComision.create({
      data,
      select: HORARIO_SELECT,
    });
  }

  /**
   * Obtiene un aula por su nombre, o la crea si no existe (upsert)
   * @param tx - Cliente de transacción Prisma
   * @param nombreAula - Nombre del aula
   * @returns El aula encontrada o creada
   */
  async upsertAula(tx: Prisma.TransactionClient, nombreAula: string) {
    return tx.aula.upsert({
      where: { nombre: nombreAula },
      update: {},
      create: { nombre: nombreAula },
    });
  }

  /**
   * Ejecuta una transacción Prisma
   * @param fn - Función a ejecutar dentro de la transacción
   * @returns Resultado de la transacción
   */
  async ejecutarTransaccion<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ) {
    return this.prisma.$transaction(fn);
  }

  /**
   * Busca un horario por ID y comisión
   * @param idHorario - ID del horario
   * @param idComision - ID de la comisión
   * @returns El horario encontrado, o null si no existe
   */
  async buscarHorario(idHorario: number, idComision: number) {
    return this.prisma.horarioComision.findFirst({
      where: { id_horario_comision: idHorario, id_comision: idComision },
    });
  }

  /**
   * Realiza soft-delete de un horario (activo = false)
   * @param idHorario - ID del horario a desactivar
   */
  async desactivarHorario(idHorario: number) {
    await this.prisma.horarioComision.update({
      where: { id_horario_comision: idHorario },
      data: { activo: false },
    });
  }

  /**
   * Reactiva un horario (activo = true)
   * @param idHorario - ID del horario a reactivar
   * @returns El horario reactivado con relaciones
   */
  async reactivarHorario(idHorario: number) {
    return this.prisma.horarioComision.update({
      where: { id_horario_comision: idHorario },
      data: { activo: true },
      select: HORARIO_SELECT,
    });
  }

  /**
   * Crea un evento asociado a una comisión
   * @param idComision - ID de la comisión
   * @param dto - Datos del evento a crear
   * @returns El evento creado
   */
  async crearEvento(idComision: number, dto: CreateEventoDto) {
    return this.prisma.evento.create({
      data: {
        ...dto,
        id_comision: idComision,
        fecha_inicio: new Date(dto.fecha_inicio),
        fecha_fin: new Date(dto.fecha_fin),
      },
    });
  }

  /**
   * Busca un evento por ID y comisión
   * @param idEvento - ID del evento
   * @param idComision - ID de la comisión
   * @returns El evento encontrado, o null si no existe
   */
  async buscarEvento(idEvento: number, idComision: number) {
    return this.prisma.evento.findFirst({
      where: { id_evento: idEvento, id_comision: idComision },
    });
  }

  /**
   * Modifica un evento existente
   * @param idEvento - ID del evento a modificar
   * @param dto - Datos parciales a actualizar
   * @returns El evento actualizado
   */
  async modificarEvento(
    idEvento: number,
    dto: Prisma.EventoUpdateInput & {
      fecha_inicio?: string;
      fecha_fin?: string;
    },
  ) {
    return this.prisma.evento.update({
      where: { id_evento: idEvento },
      data: {
        ...dto,
        ...(dto.fecha_inicio && {
          fecha_inicio: new Date(dto.fecha_inicio as string),
        }),
        ...(dto.fecha_fin && { fecha_fin: new Date(dto.fecha_fin as string) }),
      },
    });
  }

  /**
   * Realiza soft-delete de un evento (activo = false)
   * @param idEvento - ID del evento a desactivar
   */
  async desactivarEvento(idEvento: number) {
    await this.prisma.evento.update({
      where: { id_evento: idEvento },
      data: { activo: false },
    });
  }

  /**
   * Reactiva un evento (activo = true)
   * @param idEvento - ID del evento a reactivar
   * @returns El evento reactivado
   */
  async reactivarEvento(idEvento: number) {
    return this.prisma.evento.update({
      where: { id_evento: idEvento },
      data: { activo: true },
    });
  }

  /**
   * Verifica si un usuario tiene rol 'estudiante'
   * @param idUsuario - ID del usuario a verificar
   * @returns El registro de rol si es estudiante, null si no lo es
   */
  async verificarEsEstudiante(idUsuario: number) {
    return this.prisma.rolUsuario.findFirst({
      where: {
        id_usuario: idUsuario,
        rol: { nombre_rol: 'estudiante' },
      },
      select: { id_usuario: true },
    });
  }

  /**
   * Obtiene los horarios activos de una comisión para un día específico
   * @param idComision - ID de la comisión
   * @param numeroDia - Número del día (1=Lunes, ...)
   * @returns Lista de horarios activos con hora_inicio y hora_fin
   */
  async obtenerHorariosActivosPorDia(idComision: number, numeroDia: number) {
    return this.prisma.horarioComision.findMany({
      where: { id_comision: idComision, numero_dia: numeroDia, activo: true },
      select: { hora_inicio: true, hora_fin: true, id_horario_comision: true },
    });
  }

  /**
   * Busca una inscripción activa de un usuario en cualquier comisión de una materia
   * @param idUsuario - ID del usuario
   * @param idMateria - ID de la materia
   * @returns La inscripción encontrada con datos de la comisión, o null
   */
  async buscarInscripcionActivaEnMateria(idUsuario: number, idMateria: number) {
    return this.prisma.usuarioComision.findFirst({
      where: {
        id_usuario: idUsuario,
        estado: 'ACTIVO',
        comision: { id_materia: idMateria },
      },
      select: {
        id_comision: true,
        comision: {
          select: {
            id_comision: true,
            numero_comision: true,
            nombre_comision: true,
          },
        },
      },
    });
  }
}

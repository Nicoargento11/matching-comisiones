import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateIntercambioDto } from '../dto/create-intercambio.dto';

const INTERCAMBIO_SELECT = {
  id_intercambio: true,
  fecha_solicitud: true,
  estado: { select: { id_estado: true, nombre_estado: true } },
  ofrece: {
    select: {
      usuario: { select: { id_usuario: true, nombre_usuario: true, apellido_usuario: true } },
      comision: { select: { id_comision: true, numero_comision: true, nombre_comision: true } },
    },
  },
  destino: {
    select: {
      usuario: { select: { id_usuario: true, nombre_usuario: true, apellido_usuario: true } },
      comision: { select: { id_comision: true, numero_comision: true, nombre_comision: true } },
    },
  },
} as const;

@Injectable()
export class IntercambiosRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Verifica si existe un intercambio por su ID
   * @param idIntercambio - ID del intercambio
   * @returns El intercambio o null
   */
  async verificarExistencia(idIntercambio: number) {
    return this.prisma.intercambio.findUnique({
      where: { id_intercambio: idIntercambio },
      select: {
        id_intercambio: true,
        id_estado: true,
        id_usuario_ofrece: true,
        id_comision_ofrece: true,
        id_usuario_destino: true,
        id_comision_destino: true,
      },
    });
  }

  /**
   * Obtiene el detalle completo de un intercambio
   * @param idIntercambio - ID del intercambio
   * @returns El intercambio con relaciones o null
   */
  async obtenerPorId(idIntercambio: number) {
    return this.prisma.intercambio.findUnique({
      where: { id_intercambio: idIntercambio },
      select: INTERCAMBIO_SELECT,
    });
  }

  /**
   * Obtiene los intercambios de un usuario (como oferente o destinatario)
   * @param idUsuario - ID del usuario
   * @returns Lista de intercambios
   */
  async obtenerPorUsuario(idUsuario: number) {
    return this.prisma.intercambio.findMany({
      where: {
        OR: [
          { id_usuario_ofrece: idUsuario },
          { id_usuario_destino: idUsuario },
        ],
      },
      orderBy: { fecha_solicitud: 'desc' },
      select: INTERCAMBIO_SELECT,
    });
  }

  /**
   * Busca un estado de intercambio por nombre
   * @param nombreEstado - Nombre del estado (ej: 'PENDIENTE', 'COMPLETADO')
   * @returns El estado encontrado o null
   */
  async buscarEstadoPorNombre(nombreEstado: string) {
    return this.prisma.estado.findUnique({ where: { nombre_estado: nombreEstado } });
  }

  /**
   * Verifica que ambas inscripciones (ofrece y destino) estén activas
   * @param dto - Datos del intercambio
   * @returns true si ambas están activas
   */
  async verificarInscripcionesActivas(dto: CreateIntercambioDto): Promise<boolean> {
    const [ofrece, destino] = await Promise.all([
      this.prisma.usuarioComision.findUnique({
        where: {
          id_usuario_id_comision: {
            id_usuario: dto.id_usuario_ofrece,
            id_comision: dto.id_comision_ofrece,
          },
        },
        select: { estado: true },
      }),
      this.prisma.usuarioComision.findUnique({
        where: {
          id_usuario_id_comision: {
            id_usuario: dto.id_usuario_destino,
            id_comision: dto.id_comision_destino,
          },
        },
        select: { estado: true },
      }),
    ]);
    return ofrece?.estado === 'ACTIVO' && destino?.estado === 'ACTIVO';
  }

  /**
   * Verifica si ya existe un intercambio pendiente entre las mismas comisiones
   * @param dto - Datos del intercambio
   * @returns El intercambio existente o null
   */
  async buscarIntercambioPendiente(dto: CreateIntercambioDto) {
    return this.prisma.intercambio.findFirst({
      where: {
        id_usuario_ofrece: dto.id_usuario_ofrece,
        id_comision_ofrece: dto.id_comision_ofrece,
        id_usuario_destino: dto.id_usuario_destino,
        id_comision_destino: dto.id_comision_destino,
        estado: { nombre_estado: 'PENDIENTE' },
      },
      select: { id_intercambio: true },
    });
  }

  /**
   * Crea un nuevo intercambio en estado PENDIENTE
   * @param dto - Datos del intercambio
   * @param idEstadoPendiente - ID del estado PENDIENTE
   * @returns El intercambio creado con relaciones
   */
  async crear(dto: CreateIntercambioDto, idEstadoPendiente: number) {
    return this.prisma.intercambio.create({
      data: {
        id_estado: idEstadoPendiente,
        id_usuario_ofrece: dto.id_usuario_ofrece,
        id_comision_ofrece: dto.id_comision_ofrece,
        id_usuario_destino: dto.id_usuario_destino,
        id_comision_destino: dto.id_comision_destino,
      },
      select: INTERCAMBIO_SELECT,
    });
  }

  /**
   * Completa un intercambio de forma atómica: cambia el estado, intercambia las
   * inscripciones de ambos usuarios y crea dos notificaciones MATCHING_COMISION.
   * @param idIntercambio - ID del intercambio a completar
   * @param intercambio - Datos actuales del intercambio (obtenidos de verificarExistencia)
   * @param idEstadoCompletado - ID del estado COMPLETADO
   * @param notificacionOfrece - Datos de la notificación para el usuario oferente
   * @param notificacionDestino - Datos de la notificación para el usuario destinatario
   */
  async completarAtomico(
    idIntercambio: number,
    intercambio: {
      id_usuario_ofrece: number;
      id_comision_ofrece: number;
      id_usuario_destino: number;
      id_comision_destino: number;
    },
    idEstadoCompletado: number,
    notificacionOfrece: { titulo: string; mensaje: string; datos: object },
    notificacionDestino: { titulo: string; mensaje: string; datos: object },
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.intercambio.update({
        where: { id_intercambio: idIntercambio },
        data: { id_estado: idEstadoCompletado },
      });

      await tx.usuarioComision.update({
        where: {
          id_usuario_id_comision: {
            id_usuario: intercambio.id_usuario_ofrece,
            id_comision: intercambio.id_comision_ofrece,
          },
        },
        data: { estado: 'BAJA' },
      });

      const existeOfreceEnDestino = await tx.usuarioComision.findUnique({
        where: {
          id_usuario_id_comision: {
            id_usuario: intercambio.id_usuario_ofrece,
            id_comision: intercambio.id_comision_destino,
          },
        },
      });
      if (existeOfreceEnDestino) {
        await tx.usuarioComision.update({
          where: {
            id_usuario_id_comision: {
              id_usuario: intercambio.id_usuario_ofrece,
              id_comision: intercambio.id_comision_destino,
            },
          },
          data: { estado: 'ACTIVO' },
        });
      } else {
        await tx.usuarioComision.create({
          data: {
            id_usuario: intercambio.id_usuario_ofrece,
            id_comision: intercambio.id_comision_destino,
            estado: 'ACTIVO',
          },
        });
      }

      await tx.usuarioComision.update({
        where: {
          id_usuario_id_comision: {
            id_usuario: intercambio.id_usuario_destino,
            id_comision: intercambio.id_comision_destino,
          },
        },
        data: { estado: 'BAJA' },
      });

      const existeDestinoEnOfrece = await tx.usuarioComision.findUnique({
        where: {
          id_usuario_id_comision: {
            id_usuario: intercambio.id_usuario_destino,
            id_comision: intercambio.id_comision_ofrece,
          },
        },
      });
      if (existeDestinoEnOfrece) {
        await tx.usuarioComision.update({
          where: {
            id_usuario_id_comision: {
              id_usuario: intercambio.id_usuario_destino,
              id_comision: intercambio.id_comision_ofrece,
            },
          },
          data: { estado: 'ACTIVO' },
        });
      } else {
        await tx.usuarioComision.create({
          data: {
            id_usuario: intercambio.id_usuario_destino,
            id_comision: intercambio.id_comision_ofrece,
            estado: 'ACTIVO',
          },
        });
      }

      await tx.notificacion.create({
        data: {
          id_usuario: intercambio.id_usuario_ofrece,
          tipo: 'MATCHING_COMISION',
          titulo: notificacionOfrece.titulo,
          mensaje: notificacionOfrece.mensaje,
          datos: notificacionOfrece.datos,
        },
      });

      await tx.notificacion.create({
        data: {
          id_usuario: intercambio.id_usuario_destino,
          tipo: 'MATCHING_COMISION',
          titulo: notificacionDestino.titulo,
          mensaje: notificacionDestino.mensaje,
          datos: notificacionDestino.datos,
        },
      });
    });
  }
}

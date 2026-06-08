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

export abstract class IntercambiosRepository {
  abstract verificarExistencia(idIntercambio: number): ReturnType<PrismaIntercambiosRepository['verificarExistencia']>;
  abstract obtenerPorId(idIntercambio: number): ReturnType<PrismaIntercambiosRepository['obtenerPorId']>;
  abstract obtenerPorUsuario(idUsuario: number): ReturnType<PrismaIntercambiosRepository['obtenerPorUsuario']>;
  abstract buscarEstadoPorNombre(nombreEstado: string): ReturnType<PrismaIntercambiosRepository['buscarEstadoPorNombre']>;
  abstract verificarInscripcionesActivas(dto: CreateIntercambioDto): Promise<boolean>;
  abstract verificarMismaMateria(idComisionOfrece: number, idComisionDestino: number): Promise<boolean>;
  abstract obtenerCandidatos(
    idComisionOrigen: number,
    idUsuarioSolicitante: number,
  ): ReturnType<PrismaIntercambiosRepository['obtenerCandidatos']>;
  abstract buscarIntercambioPendiente(dto: CreateIntercambioDto): ReturnType<PrismaIntercambiosRepository['buscarIntercambioPendiente']>;
  abstract crearIntercambio(dto: CreateIntercambioDto, idEstadoPendiente: number): ReturnType<PrismaIntercambiosRepository['crearIntercambio']>;
  abstract obtenerDatosCompletos(idIntercambio: number): ReturnType<PrismaIntercambiosRepository['obtenerDatosCompletos']>;
  abstract completarAtomico(
    idIntercambio: number,
    intercambio: {
      id_usuario_ofrece: number;
      id_comision_ofrece: number;
      id_usuario_destino: number;
      id_comision_destino: number;
    },
    idEstadoCompletado: number,
  ): ReturnType<PrismaIntercambiosRepository['completarAtomico']>;
}

@Injectable()
export class PrismaIntercambiosRepository extends IntercambiosRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

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
   * Verifica que ambas comisiones del intercambio pertenezcan a la misma materia
   * @param idComisionOfrece - ID de la comisión que se ofrece
   * @param idComisionDestino - ID de la comisión destino
   * @returns true si ambas comisiones existen y comparten la misma materia
   */
  async verificarMismaMateria(idComisionOfrece: number, idComisionDestino: number): Promise<boolean> {
    const [ofrece, destino] = await Promise.all([
      this.prisma.comision.findUnique({
        where: { id_comision: idComisionOfrece },
        select: { id_materia: true },
      }),
      this.prisma.comision.findUnique({
        where: { id_comision: idComisionDestino },
        select: { id_materia: true },
      }),
    ]);
    return ofrece !== null && destino !== null && ofrece.id_materia === destino.id_materia;
  }

  /**
   * Busca candidatos válidos para intercambiar con el solicitante: alumnos con
   * inscripción ACTIVA en otras comisiones de la misma materia que la comisión origen
   * @param idComisionOrigen - ID de la comisión que ofrece el solicitante
   * @param idUsuarioSolicitante - ID del usuario solicitante (se excluye de los resultados)
   * @returns Lista de candidatos (usuario + su comisión) o null si la comisión origen no existe
   */
  async obtenerCandidatos(idComisionOrigen: number, idUsuarioSolicitante: number) {
    const comisionOrigen = await this.prisma.comision.findUnique({
      where: { id_comision: idComisionOrigen },
      select: { id_materia: true },
    });
    if (!comisionOrigen) return null;

    return this.prisma.usuarioComision.findMany({
      where: {
        estado: 'ACTIVO',
        id_usuario: { not: idUsuarioSolicitante },
        comision: {
          id_materia: comisionOrigen.id_materia,
          id_comision: { not: idComisionOrigen },
        },
      },
      select: {
        usuario: {
          select: { id_usuario: true, nombre_usuario: true, apellido_usuario: true, dni: true },
        },
        comision: {
          select: { id_comision: true, numero_comision: true, nombre_comision: true },
        },
      },
      orderBy: [{ usuario: { apellido_usuario: 'asc' } }, { usuario: { nombre_usuario: 'asc' } }],
    });
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
  async crearIntercambio(dto: CreateIntercambioDto, idEstadoPendiente: number) {
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
   * Obtiene los datos completos de un intercambio con usuarios, comisiones y profesores
   * @param idIntercambio - ID del intercambio
   * @returns Datos completos o null si no existe
   */
  async obtenerDatosCompletos(idIntercambio: number) {
    return this.prisma.intercambio.findUnique({
      where: { id_intercambio: idIntercambio },
      select: {
        id_intercambio: true,
        id_estado: true,
        id_comision_ofrece: true,
        id_comision_destino: true,
        ofrece: {
          select: {
            usuario: { select: { id_usuario: true, nombre_usuario: true, apellido_usuario: true, dni: true, correo: true } },
            comision: {
              select: {
                id_comision: true,
                nombre_comision: true,
                numero_comision: true,
                profesor: { select: { id_usuario: true, nombre_usuario: true, apellido_usuario: true, correo: true } },
              },
            },
          },
        },
        destino: {
          select: {
            usuario: { select: { id_usuario: true, nombre_usuario: true, apellido_usuario: true, dni: true, correo: true } },
            comision: {
              select: {
                id_comision: true,
                nombre_comision: true,
                numero_comision: true,
                profesor: { select: { id_usuario: true, nombre_usuario: true, apellido_usuario: true, correo: true } },
              },
            },
          },
        },
      },
    });
  }

  /**
   * Completa un intercambio de forma atómica: cambia el estado e intercambia las
   * inscripciones de ambos usuarios. Solo transición de estado + swap de
   * comisiones — NO persiste notificaciones (eso es responsabilidad de
   * `NotificacionObserver`, que corre post-transacción y de forma aislada).
   * @param idIntercambio - ID del intercambio a completar
   * @param intercambio - Datos del intercambio (IDs de usuarios y comisiones)
   * @param idEstadoCompletado - ID del estado COMPLETADO
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
    });
  }
}

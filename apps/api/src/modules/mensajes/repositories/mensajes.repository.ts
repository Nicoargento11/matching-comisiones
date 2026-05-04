import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginacionParams } from '../../../common/helpers/paginacion';
import { CreateMensajeDto } from '../dto/create-mensaje.dto';
import { CreateConversacionDto } from '../dto/create-conversacion.dto';

@Injectable()
export class MensajesRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Busca una conversación existente entre dos usuarios
   * @param idUsuario1 - ID del primer usuario
   * @param idUsuario2 - ID del segundo usuario
   * @returns La conversación existente, o null si no existe
   */
  async buscarConversacionExistente(idUsuario1: number, idUsuario2: number) {
    return this.prisma.conversacion.findFirst({
      where: {
        AND: [
          { participantes: { some: { id_usuario: idUsuario1 } } },
          { participantes: { some: { id_usuario: idUsuario2 } } },
        ],
      },
      select: { id_conversacion: true },
    });
  }

  /**
   * Crea una nueva conversación con dos participantes
   * @param dto - Datos con los IDs de los dos participantes
   * @returns La conversación creada con datos de participantes
   */
  async crearConversacion(dto: CreateConversacionDto) {
    return this.prisma.conversacion.create({
      data: {
        participantes: {
          create: [
            { id_usuario: dto.id_usuario_1 },
            { id_usuario: dto.id_usuario_2 },
          ],
        },
      },
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
      },
    });
  }

  /**
   * Obtiene una conversación por su ID con participantes y mensajes
   * @param idConversacion - ID de la conversación
   * @returns La conversación con mensajes y participantes, o null
   */
  async obtenerConversacion(idConversacion: number) {
    return this.prisma.conversacion.findUnique({
      where: { id_conversacion: idConversacion },
      select: {
        id_conversacion: true,
        creada_en: true,
        participantes: {
          select: {
            ultimo_leido: true,
            usuario: {
              select: {
                id_usuario: true,
                nombre_usuario: true,
                apellido_usuario: true,
                roles: {
                  select: { rol: { select: { nombre_rol: true } } },
                },
              },
            },
          },
        },
        mensajes: {
          orderBy: { creado_en: 'asc' },
          select: {
            id_mensaje: true,
            contenido: true,
            creado_en: true,
            emisor: {
              select: {
                id_usuario: true,
                nombre_usuario: true,
                apellido_usuario: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Busca un participante en una conversación
   * @param idConversacion - ID de la conversación
   * @param idUsuario - ID del usuario
   * @returns El participante encontrado, o null
   */
  async buscarParticipante(idConversacion: number, idUsuario: number) {
    return this.prisma.conversacionParticipante.findUnique({
      where: {
        id_conversacion_id_usuario: {
          id_conversacion: idConversacion,
          id_usuario: idUsuario,
        },
      },
    });
  }

  /**
   * Actualiza la fecha de último leído de un participante
   * @param idConversacion - ID de la conversación
   * @param idUsuario - ID del usuario
   * @returns El participante actualizado
   */
  async actualizarUltimoLeido(idConversacion: number, idUsuario: number) {
    return this.prisma.conversacionParticipante.update({
      where: {
        id_conversacion_id_usuario: {
          id_conversacion: idConversacion,
          id_usuario: idUsuario,
        },
      },
      data: { ultimo_leido: new Date() },
      select: { id_conversacion: true, id_usuario: true, ultimo_leido: true },
    });
  }

  /**
   * Verifica si existe una conversación por su ID
   * @param idConversacion - ID de la conversación
   * @returns La conversación encontrada, o null
   */
  async verificarExistenciaConversacion(idConversacion: number) {
    return this.prisma.conversacion.findUnique({
      where: { id_conversacion: idConversacion },
      select: { id_conversacion: true },
    });
  }

  /**
   * Obtiene los mensajes de una conversación ordenados por fecha
   * @param idConversacion - ID de la conversación
   * @returns Lista de mensajes con datos del emisor
   */
  async obtenerMensajes(idConversacion: number) {
    return this.prisma.mensaje.findMany({
      where: { id_conversacion: idConversacion },
      orderBy: { creado_en: 'asc' },
      select: {
        id_mensaje: true,
        contenido: true,
        creado_en: true,
        emisor: {
          select: {
            id_usuario: true,
            nombre_usuario: true,
            apellido_usuario: true,
          },
        },
      },
    });
  }

  /**
   * Busca un usuario por su supabase_auth_id
   * @param supabaseAuthId - ID de autenticación de Supabase
   * @returns Datos mínimos del usuario (id_usuario), o null
   */
  async buscarUsuarioPorAuthId(supabaseAuthId: string) {
    return this.prisma.usuario.findUnique({
      where: { supabase_auth_id: supabaseAuthId },
      select: { id_usuario: true },
    });
  }

  /**
   * Obtiene las conversaciones de un usuario con último mensaje, con paginación
   * @param idUsuario - ID del usuario
   * @param paginacion - Parámetros de paginación (skip, take, orderBy)
   * @returns Lista paginada de conversaciones con participantes y último mensaje
   */
  async obtenerConversacionesDeUsuario(
    idUsuario: number,
    paginacion: PaginacionParams,
  ) {
    return this.prisma.conversacion.findMany({
      where: { participantes: { some: { id_usuario: idUsuario } } },
      orderBy: { creada_en: 'desc' },
      select: {
        id_conversacion: true,
        creada_en: true,
        participantes: {
          select: {
            ultimo_leido: true,
            usuario: {
              select: {
                id_usuario: true,
                nombre_usuario: true,
                apellido_usuario: true,
                roles: {
                  select: { rol: { select: { nombre_rol: true } } },
                },
              },
            },
          },
        },
        mensajes: {
          orderBy: { creado_en: 'desc' },
          take: 1,
          select: {
            contenido: true,
            creado_en: true,
            id_usuario_emisor: true,
          },
        },
      },
      ...paginacion,
    });
  }

  /**
   * Cuenta la cantidad de conversaciones de un usuario
   * @param idUsuario - ID del usuario
   * @returns Número total de conversaciones del usuario
   */
  async contarConversacionesDeUsuario(idUsuario: number): Promise<number> {
    return this.prisma.conversacion.count({
      where: { participantes: { some: { id_usuario: idUsuario } } },
    });
  }

  /**
   * Crea un nuevo mensaje en una conversación
   * @param dto - Datos del mensaje a crear
   * @returns El mensaje creado
   */
  async crearMensaje(dto: CreateMensajeDto) {
    return this.prisma.mensaje.create({
      data: {
        contenido: dto.contenido,
        id_conversacion: dto.id_conversacion,
        id_usuario_emisor: dto.id_usuario_emisor,
      },
      select: {
        id_mensaje: true,
        contenido: true,
        creado_en: true,
        id_conversacion: true,
        id_usuario_emisor: true,
      },
    });
  }
}

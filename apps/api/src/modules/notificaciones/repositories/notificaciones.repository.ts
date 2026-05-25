import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { TipoNotificacion } from '@prisma/client';

export interface CrearNotificacionData {
  id_usuario: number;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  datos?: object;
}

const NOTIFICACION_SELECT = {
  id_notificacion: true,
  tipo: true,
  titulo: true,
  mensaje: true,
  leida: true,
  creada_en: true,
  datos: true,
} as const;

@Injectable()
export class NotificacionesRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtiene todas las notificaciones de un usuario, ordenadas por fecha desc
   * @param idUsuario - ID del usuario
   * @returns Lista de notificaciones del usuario
   */
  async obtenerPorUsuario(idUsuario: number) {
    return this.prisma.notificacion.findMany({
      where: { id_usuario: idUsuario },
      orderBy: { creada_en: 'desc' },
      select: NOTIFICACION_SELECT,
    });
  }

  /**
   * Verifica si existe una notificación por su ID
   * @param idNotificacion - ID de la notificación
   * @returns La notificación encontrada o null
   */
  async verificarExistencia(idNotificacion: number) {
    return this.prisma.notificacion.findUnique({
      where: { id_notificacion: idNotificacion },
      select: { id_notificacion: true, id_usuario: true },
    });
  }

  /**
   * Marca una notificación como leída
   * @param idNotificacion - ID de la notificación
   * @returns La notificación actualizada
   */
  async marcarLeida(idNotificacion: number) {
    return this.prisma.notificacion.update({
      where: { id_notificacion: idNotificacion },
      data: { leida: true },
      select: NOTIFICACION_SELECT,
    });
  }

  /**
   * Marca todas las notificaciones de un usuario como leídas
   * @param idUsuario - ID del usuario
   */
  async marcarTodasLeidas(idUsuario: number) {
    await this.prisma.notificacion.updateMany({
      where: { id_usuario: idUsuario, leida: false },
      data: { leida: true },
    });
  }

  /**
   * Crea una notificación dentro de una transacción Prisma activa
   * @param tx - Cliente de transacción Prisma
   * @param data - Datos de la notificación a crear
   */
  async crearEnTransaccion(
    tx: Omit<PrismaService, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>,
    data: CrearNotificacionData,
  ) {
    return tx.notificacion.create({
      data: {
        id_usuario: data.id_usuario,
        tipo: data.tipo,
        titulo: data.titulo,
        mensaje: data.mensaje,
        datos: data.datos ?? undefined,
      },
      select: NOTIFICACION_SELECT,
    });
  }
}

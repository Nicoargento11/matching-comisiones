import { Injectable } from '@nestjs/common';
import { TipoNotificacion } from '@prisma/client';
import { ForbiddenError, NotFoundError } from '../../common/errors/business-error';
import { IMatchingObserver, MatchingCompletadoData } from '../matching/interfaces/matching-observer.interface';
import { NotificacionesRepository, CrearNotificacionData } from './repositories/notificaciones.repository';
import { mapearNotificacionResponse } from './notificaciones.mapper';
import { NotificacionResponseDto } from './dto/notificacion-response.dto';

@Injectable()
export class NotificacionesService implements IMatchingObserver {
  constructor(private readonly notificacionesRepository: NotificacionesRepository) {}

  async crearNotificacion(data: CrearNotificacionData): Promise<void> {
    await this.notificacionesRepository.crearNotificacion(data);
  }

  /**
   * Obtiene todas las notificaciones del usuario autenticado
   * @param idUsuario - ID del usuario
   * @returns Lista de notificaciones mapeadas al DTO de respuesta
   */
  async obtenerPorUsuario(idUsuario: number): Promise<NotificacionResponseDto[]> {
    const notificaciones = await this.notificacionesRepository.obtenerPorUsuario(idUsuario);
    return notificaciones.map(mapearNotificacionResponse);
  }

  /**
   * Marca una notificación como leída
   * @param idNotificacion - ID de la notificación
   * @returns La notificación actualizada
   * @throws NotFoundException si no existe la notificación
   */
  async marcarSoloLeida(idNotificacion: number, idUsuario: number): Promise<NotificacionResponseDto> {
    const notificacion = await this.notificacionesRepository.verificarExistencia(idNotificacion);
    if (!notificacion) {
      throw new NotFoundError('NOTIFICACION_NO_ENCONTRADA', 'Notificación no encontrada');
    }
    if (notificacion.id_usuario !== idUsuario) {
      throw new ForbiddenError('NOTIFICACION_ACCESO_DENEGADO', 'No tenés acceso a esta notificación');
    }
    const actualizada = await this.notificacionesRepository.marcarLeida(idNotificacion);
    return mapearNotificacionResponse(actualizada);
  }

  /**
   * Marca todas las notificaciones del usuario como leídas
   * @param idUsuario - ID del usuario autenticado
   */
  async marcarTodasLeidas(idUsuario: number): Promise<void> {
    await this.notificacionesRepository.marcarTodasLeidas(idUsuario);
  }

  async onMatchingCompleted(data: MatchingCompletadoData): Promise<void> {
    await this.notificacionesRepository.crearNotificacion({
      id_usuario: data.usuarioSolicitanteId,
      tipo: TipoNotificacion.MATCHING_COMISION,
      titulo: 'Matching completado',
      mensaje: `Tu intercambio #${data.intercambioId} fue completado exitosamente.`,
      datos: { intercambioId: data.intercambioId },
    });

    await this.notificacionesRepository.crearNotificacion({
      id_usuario: data.usuarioReceptorId,
      tipo: TipoNotificacion.MATCHING_COMISION,
      titulo: 'Matching completado',
      mensaje: `El intercambio #${data.intercambioId} fue completado exitosamente.`,
      datos: { intercambioId: data.intercambioId },
    });
  }
}

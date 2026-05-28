import { Injectable } from '@nestjs/common';
import { ForbiddenError, NotFoundError } from '../../common/errors/business-error';
import { NotificacionesRepository } from './repositories/notificaciones.repository';
import { mapearNotificacionResponse } from './notificaciones.mapper';
import { NotificacionResponseDto } from './dto/notificacion-response.dto';

@Injectable()
export class NotificacionesService {
  constructor(private readonly notificacionesRepository: NotificacionesRepository) {}

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
}

import { Injectable } from '@nestjs/common';
import { TipoNotificacion } from '@prisma/client';
import { IMatchingObserver, MatchingCompletadoData } from '../../matching/interfaces/matching-observer.interface';
import { NotificacionesRepository } from '../repositories/notificaciones.repository';

@Injectable()
export class NotificacionesMatchingObserver implements IMatchingObserver {
  constructor(private readonly notificacionesRepository: NotificacionesRepository) {}

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

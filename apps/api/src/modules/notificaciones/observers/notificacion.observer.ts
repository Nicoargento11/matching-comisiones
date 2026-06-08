import { Injectable } from '@nestjs/common';
import { TipoNotificacion } from '@prisma/client';
import { CrearNotificacionData, NotificacionesRepository } from '../repositories/notificaciones.repository';
import { IntercambioCompletadoEvent } from '../../intercambios/events/intercambio-completado.event';
import { IIntercambioObserver, ObserverFailureMode } from '../../intercambios/observers/intercambio-observer.interface';

/**
 * Observer BEST-EFFORT de `IntercambioCompletado`: construye y persiste las 4
 * notificaciones (deduplicadas por `id_usuario`) que antes `completar` armaba
 * inline y `completarAtomico` persistía dentro de la transacción.
 *
 * Cambio semántico aceptado (proposal Fork/Risk 2): ahora corre POST-transacción
 * y de forma aislada — si falla, el subject lo captura vía `Promise.allSettled`
 * y lo registra con `logger.error`; el `Intercambio` permanece COMPLETADO sin
 * rollback.
 *
 * Construye su salida únicamente desde el payload del evento (cero re-fetch).
 */
@Injectable()
export class NotificacionObserver implements IIntercambioObserver {
  readonly failureMode: ObserverFailureMode = 'best-effort';

  constructor(private readonly notificacionesRepository: NotificacionesRepository) {}

  async onIntercambioCompletado(evento: IntercambioCompletadoEvent): Promise<void> {
    const notificaciones = this.construirNotificaciones(evento);
    for (const notificacion of notificaciones) {
      await this.notificacionesRepository.crearNotificacion(notificacion);
    }
  }

  private construirNotificaciones(evento: IntercambioCompletadoEvent): CrearNotificacionData[] {
    const nombreComisionOfrece =
      evento.ofrece.comision.nombre_comision ?? `Comisión ${evento.ofrece.comision.numero_comision}`;
    const nombreComisionDestino =
      evento.destino.comision.nombre_comision ?? `Comisión ${evento.destino.comision.numero_comision}`;

    const todas: CrearNotificacionData[] = [
      {
        id_usuario: evento.ofrece.usuario.id_usuario,
        tipo: TipoNotificacion.MATCHING_COMISION,
        titulo: 'Cambio de comisión completado',
        mensaje: 'Tu intercambio de comisión fue completado exitosamente.',
        datos: { id_intercambio: evento.id_intercambio, id_comision: evento.id_comision_destino },
      },
      {
        id_usuario: evento.destino.usuario.id_usuario,
        tipo: TipoNotificacion.MATCHING_COMISION,
        titulo: 'Cambio de comisión completado',
        mensaje: 'Tu intercambio de comisión fue completado exitosamente.',
        datos: { id_intercambio: evento.id_intercambio, id_comision: evento.id_comision_ofrece },
      },
      {
        id_usuario: evento.ofrece.comision.profesor.id_usuario,
        tipo: TipoNotificacion.INTERCAMBIO_EN_COMISION,
        titulo: 'Intercambio de alumnos en tu comisión',
        mensaje: `${evento.ofrece.usuario.nombre_usuario} ${evento.ofrece.usuario.apellido_usuario} (DNI ${evento.ofrece.usuario.dni}) salió de tu comisión y fue reemplazado por ${evento.destino.usuario.nombre_usuario} ${evento.destino.usuario.apellido_usuario} (DNI ${evento.destino.usuario.dni}), proveniente de ${nombreComisionDestino} (Prof. ${evento.destino.comision.profesor.nombre_usuario} ${evento.destino.comision.profesor.apellido_usuario}).`,
        datos: {
          alumno_sale: { nombre_usuario: evento.ofrece.usuario.nombre_usuario, apellido_usuario: evento.ofrece.usuario.apellido_usuario, dni: evento.ofrece.usuario.dni },
          alumno_entra: { nombre_usuario: evento.destino.usuario.nombre_usuario, apellido_usuario: evento.destino.usuario.apellido_usuario, dni: evento.destino.usuario.dni },
          comision_origen: { id_comision: evento.id_comision_ofrece, nombre: nombreComisionOfrece },
          comision_destino: { id_comision: evento.id_comision_destino, nombre: nombreComisionDestino },
          profesor_otra_comision: { nombre_usuario: evento.destino.comision.profesor.nombre_usuario, apellido_usuario: evento.destino.comision.profesor.apellido_usuario },
        },
      },
      {
        id_usuario: evento.destino.comision.profesor.id_usuario,
        tipo: TipoNotificacion.INTERCAMBIO_EN_COMISION,
        titulo: 'Intercambio de alumnos en tu comisión',
        mensaje: `${evento.destino.usuario.nombre_usuario} ${evento.destino.usuario.apellido_usuario} (DNI ${evento.destino.usuario.dni}) salió de tu comisión y fue reemplazado por ${evento.ofrece.usuario.nombre_usuario} ${evento.ofrece.usuario.apellido_usuario} (DNI ${evento.ofrece.usuario.dni}), proveniente de ${nombreComisionOfrece} (Prof. ${evento.ofrece.comision.profesor.nombre_usuario} ${evento.ofrece.comision.profesor.apellido_usuario}).`,
        datos: {
          alumno_sale: { nombre_usuario: evento.destino.usuario.nombre_usuario, apellido_usuario: evento.destino.usuario.apellido_usuario, dni: evento.destino.usuario.dni },
          alumno_entra: { nombre_usuario: evento.ofrece.usuario.nombre_usuario, apellido_usuario: evento.ofrece.usuario.apellido_usuario, dni: evento.ofrece.usuario.dni },
          comision_origen: { id_comision: evento.id_comision_destino, nombre: nombreComisionDestino },
          comision_destino: { id_comision: evento.id_comision_ofrece, nombre: nombreComisionOfrece },
          profesor_otra_comision: { nombre_usuario: evento.ofrece.comision.profesor.nombre_usuario, apellido_usuario: evento.ofrece.comision.profesor.apellido_usuario },
        },
      },
    ];

    const vistos = new Set<number>();
    return todas.filter((notificacion) => {
      if (vistos.has(notificacion.id_usuario)) return false;
      vistos.add(notificacion.id_usuario);
      return true;
    });
  }
}

import { Injectable } from '@nestjs/common';
import { DatosComprobante } from '../comprobante.template';
import { ComprobantePdfService } from '../services/comprobante-pdf.service';
import { ComprobantesStorageService } from '../services/comprobantes-storage.service';
import { ComprobantesRepository } from '../repositories/comprobantes.repository';
import { IntercambioCompletadoEvent } from '../../intercambios/events/intercambio-completado.event';
import { IIntercambioObserver, ObserverFailureMode, ObserverResultado } from '../../intercambios/observers/intercambio-observer.interface';

/**
 * Observer CRÍTICO de `IntercambioCompletado`: genera el PDF del comprobante,
 * lo sube a storage y persiste el registro `Comprobante`.
 *
 * Si cualquiera de los tres pasos falla, el error sube al subject, que lo
 * re-lanza — rompiendo `notificar`/`completar`. `IntercambiosService.completar`
 * captura el error y ejecuta `revertirIntercambio` como compensación,
 * deshaciendo el swap atómicamente para volver el intercambio a PENDIENTE.
 *
 * Construye `DatosComprobante` directamente del payload del evento: cero
 * re-fetch de usuarios/comisiones/profesores (ya vienen en el evento rico).
 */
@Injectable()
export class ComprobanteObserver implements IIntercambioObserver {
  readonly failureMode: ObserverFailureMode = 'critical';

  constructor(
    private readonly comprobantePdf: ComprobantePdfService,
    private readonly comprobantesStorage: ComprobantesStorageService,
    private readonly comprobantesRepository: ComprobantesRepository,
  ) {}

  async onIntercambioCompletado(evento: IntercambioCompletadoEvent): Promise<ObserverResultado> {
    const datosComprobante = this.construirDatosComprobante(evento);

    const pdfBuffer = await this.comprobantePdf.generarPdf(datosComprobante);
    const publicUrl = await this.comprobantesStorage.subirPdf(evento.id_intercambio, pdfBuffer);
    await this.comprobantesRepository.crearComprobante(evento.id_intercambio, publicUrl);

    return { comprobanteUrl: publicUrl };
  }

  private construirDatosComprobante(evento: IntercambioCompletadoEvent): DatosComprobante {
    return {
      idIntercambio: evento.id_intercambio,
      fechaGeneracion: evento.completadoEn,
      alumnoOfrece: {
        nombre_usuario: evento.ofrece.usuario.nombre_usuario,
        apellido_usuario: evento.ofrece.usuario.apellido_usuario,
        dni: evento.ofrece.usuario.dni,
      },
      comisionOfrece: {
        nombre_comision: evento.ofrece.comision.nombre_comision,
        numero_comision: evento.ofrece.comision.numero_comision,
        profesor: {
          nombre_usuario: evento.ofrece.comision.profesor.nombre_usuario,
          apellido_usuario: evento.ofrece.comision.profesor.apellido_usuario,
        },
      },
      alumnoDestino: {
        nombre_usuario: evento.destino.usuario.nombre_usuario,
        apellido_usuario: evento.destino.usuario.apellido_usuario,
        dni: evento.destino.usuario.dni,
      },
      comisionDestino: {
        nombre_comision: evento.destino.comision.nombre_comision,
        numero_comision: evento.destino.comision.numero_comision,
        profesor: {
          nombre_usuario: evento.destino.comision.profesor.nombre_usuario,
          apellido_usuario: evento.destino.comision.profesor.apellido_usuario,
        },
      },
    };
  }
}

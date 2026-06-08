import { Injectable, Logger } from '@nestjs/common';
import { DatosComprobante } from '../../comprobantes/comprobante.template';
import { ComprobantePdfService } from '../../comprobantes/services/comprobante-pdf.service';
import { EmailService } from '../../email/email.service';
import { IntercambioCompletadoEvent } from '../events/intercambio-completado.event';
import { IIntercambioObserver, ObserverFailureMode } from './intercambio-observer.interface';

/**
 * Observer BEST-EFFORT de `IntercambioCompletado`: envía el comprobante por
 * email a ambos alumnos y notifica a los profesores involucrados (deduplicados
 * por `id_usuario`), preservando el aislamiento por-destinatario (try/catch +
 * `logger.error`) que `completar` ya tenía inline.
 *
 * DECISIÓN DE DESIGN (documentada en design §4.8 / tasks 2.1): este observer
 * REGENERA el PDF llamando a `ComprobantePdfService.generar` por su cuenta en
 * lugar de recibir el buffer del `ComprobanteObserver`. Alternativa rechazada:
 * pasar el buffer a través de `ObserverResultado` — esto re-acoplaría observers
 * que deben permanecer independientes (rompe SRP/OCP del patrón). El costo
 * aceptado es una segunda generación de PDF (CPU local, sin I/O de red).
 */
@Injectable()
export class EmailObserver implements IIntercambioObserver {
  private readonly logger = new Logger(EmailObserver.name);
  readonly failureMode: ObserverFailureMode = 'best-effort';

  constructor(
    private readonly email: EmailService,
    private readonly comprobantePdf: ComprobantePdfService,
  ) {}

  async onIntercambioCompletado(evento: IntercambioCompletadoEvent): Promise<void> {
    const datosComprobante = this.construirDatosComprobante(evento);
    const pdfBuffer = await this.comprobantePdf.generar(datosComprobante);

    await this.enviarComprobanteAAlumno(evento.ofrece.usuario.correo, datosComprobante, pdfBuffer);
    await this.enviarComprobanteAAlumno(evento.destino.usuario.correo, datosComprobante, pdfBuffer);
    await this.enviarNotificacionAProfesoresUnicos(evento, datosComprobante);
  }

  private async enviarComprobanteAAlumno(
    correo: string,
    datosComprobante: DatosComprobante,
    pdfBuffer: Buffer,
  ): Promise<void> {
    try {
      await this.email.enviarComprobanteAlumno(correo, datosComprobante, pdfBuffer);
    } catch (err) {
      this.logger.error(`Email fallido a ${correo}`, err);
    }
  }

  private async enviarNotificacionAProfesoresUnicos(
    evento: IntercambioCompletadoEvent,
    datosComprobante: DatosComprobante,
  ): Promise<void> {
    const profesoresUnicos = new Map<number, { correo: string }>();
    profesoresUnicos.set(evento.ofrece.comision.profesor.id_usuario, {
      correo: evento.ofrece.comision.profesor.correo,
    });
    profesoresUnicos.set(evento.destino.comision.profesor.id_usuario, {
      correo: evento.destino.comision.profesor.correo,
    });

    for (const [, profesor] of profesoresUnicos) {
      try {
        await this.email.enviarNotificacionProfesor(profesor.correo, datosComprobante);
      } catch (err) {
        this.logger.error(`Email fallido a ${profesor.correo}`, err);
      }
    }
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

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
 * REGENERA el PDF llamando a `ComprobantePdfService.generarPdf` por su cuenta en
 * lugar de recibir el buffer del `ComprobanteObserver`. Alternativa rechazada:
 * pasar el buffer a través de `ObserverResultado` — esto re-acoplaría observers
 * que deben permanecer independientes (rompe SRP/OCP del patrón). El costo
 * aceptado es una segunda generación de PDF (CPU local, sin I/O de red).
 *
 * RATE LIMIT HANDLING: cada envío individual reintenta hasta 2 veces con
 * backoff (5s, 10s) cuando el proveedor responde 550 "Too many emails".
 * Esto evita que el plan gratuito de Mailtrap descarte correos en ráfaga
 * sin necesidad de delays fijos entre envíos.
 */
@Injectable()
export class EmailObserver implements IIntercambioObserver {
  private readonly logger = new Logger(EmailObserver.name);
  readonly failureMode: ObserverFailureMode = 'best-effort';

  /** Máximo de reintentos por destinatario ante rate limiting. */
  private readonly MAX_RETRIES = 2;

  constructor(
    private readonly email: EmailService,
    private readonly comprobantePdf: ComprobantePdfService,
  ) {}

  async onIntercambioCompletado(evento: IntercambioCompletadoEvent): Promise<void> {
    const datosComprobante = this.construirDatosComprobante(evento);
    const pdfBuffer = await this.comprobantePdf.generarPdf(datosComprobante);

    await this.enviarComprobanteAAlumno(evento.ofrece.usuario.correo, datosComprobante, pdfBuffer);
    await this.enviarComprobanteAAlumno(evento.destino.usuario.correo, datosComprobante, pdfBuffer);
    await this.enviarNotificacionAProfesoresUnicos(evento, datosComprobante);
  }

  // ── helpers privados ──────────────────────────────────────────────────────

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Ejecuta `fn` y reintenta con backoff si el proveedor responde 550 por
   * rate limiting. Otros errores (auth, red, timeout) se loguean sin reintento.
   */
  private async conReintento(
    fn: () => Promise<void>,
    correo: string,
  ): Promise<void> {
    for (let intento = 0; intento <= this.MAX_RETRIES; intento++) {
      try {
        await fn();
        return; // éxito
      } catch (err: any) {
        const esRateLimit =
          err?.responseCode === 550 &&
          typeof err?.response === 'string' &&
          err.response.includes('Too many emails');

        if (!esRateLimit || intento === this.MAX_RETRIES) {
          this.logger.error(`Email fallido a ${correo}`, err);
          return;
        }

        const espera = 5000 * (intento + 1); // 5s → 10s
        this.logger.warn(
          `Rate limit para ${correo}, reintento ${intento + 1}/${this.MAX_RETRIES} en ${espera / 1000}s...`,
        );
        await this.delay(espera);
      }
    }
  }

  // ── envíos ────────────────────────────────────────────────────────────────

  private async enviarComprobanteAAlumno(
    correo: string,
    datosComprobante: DatosComprobante,
    pdfBuffer: Buffer,
  ): Promise<void> {
    await this.conReintento(
      () => this.email.enviarComprobanteAlumno(correo, datosComprobante, pdfBuffer),
      correo,
    );
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
      await this.conReintento(
        () => this.email.enviarNotificacionProfesor(profesor.correo, datosComprobante),
        profesor.correo,
      );
    }
  }

  // ── datos para el template ────────────────────────────────────────────────

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

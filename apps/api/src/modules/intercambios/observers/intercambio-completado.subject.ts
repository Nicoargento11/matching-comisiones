import { Injectable, Logger } from '@nestjs/common';
import { IntercambioCompletadoEvent } from '../events/intercambio-completado.event';
import { IIntercambioObserver } from './intercambio-observer.interface';

/**
 * Resultado agregado que `notificar` devuelve al caller (`IntercambiosService.completar`)
 * para alimentar la respuesta síncrona.
 */
export interface NotificarResultado {
  readonly comprobanteUrl: string;
}

/**
 * Subject del patrón Observer para el evento de dominio `IntercambioCompletado`.
 *
 * No es un bus plano de `Promise.allSettled`: clasifica a sus observers por
 * `failureMode` declarado y los ejecuta en DOS olas:
 *
 * 1. CRITICAL — secuencial, con `await` directo. Si uno lanza, el error
 *    PROPAGA (rompe `notificar` → rompe `completar` → llega al
 *    `HttpExceptionFilter`). Reservados a side-effects cuyo resultado forma
 *    parte de la respuesta síncrona (ej. `comprobanteUrl`).
 * 2. BEST-EFFORT — concurrentes vía `Promise.allSettled`. Ningún rechazo
 *    propaga; cada uno se registra con `logger.error`.
 *
 * El orden ENTRE olas es siempre crítico → best-effort, sin importar el orden
 * de registro: si el comprobante falla no tiene sentido enviar emails de algo
 * que no se generó, y el `comprobanteUrl` debe existir antes de retornar.
 */
@Injectable()
export class IntercambioCompletadoSubject {
  private readonly logger = new Logger(IntercambioCompletadoSubject.name);
  private readonly observers: IIntercambioObserver[] = [];

  registrarObserver(observer: IIntercambioObserver): void {
    this.observers.push(observer);
  }

  async notificar(evento: IntercambioCompletadoEvent): Promise<NotificarResultado> {
    const comprobanteUrl = await this.ejecutarOlaCritica(evento);
    await this.ejecutarOlaBestEffort(evento);
    return { comprobanteUrl };
  }

  private async ejecutarOlaCritica(evento: IntercambioCompletadoEvent): Promise<string> {
    let comprobanteUrl: string | undefined;

    for (const observer of this.observers.filter((o) => o.failureMode === 'critical')) {
      const resultado = await observer.onIntercambioCompletado(evento);
      if (resultado?.comprobanteUrl) {
        comprobanteUrl = resultado.comprobanteUrl;
      }
    }

    if (!comprobanteUrl) {
      throw new Error('Ningún observer crítico produjo un comprobanteUrl');
    }

    return comprobanteUrl;
  }

  private async ejecutarOlaBestEffort(evento: IntercambioCompletadoEvent): Promise<void> {
    const bestEffort = this.observers.filter((o) => o.failureMode === 'best-effort');
    const resultados = await Promise.allSettled(
      bestEffort.map((observer) => observer.onIntercambioCompletado(evento)),
    );

    resultados.forEach((resultado, indice) => {
      if (resultado.status === 'rejected') {
        this.logger.error(
          `Observer best-effort ${bestEffort[indice].constructor.name} falló`,
          resultado.reason,
        );
      }
    });
  }
}

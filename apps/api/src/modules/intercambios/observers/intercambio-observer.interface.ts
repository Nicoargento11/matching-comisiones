import { IntercambioCompletadoEvent } from '../events/intercambio-completado.event';

/**
 * Clasifica la criticidad de un observer ante el evento `IntercambioCompletado`:
 *
 * - `'critical'`: su fallo DEBE propagar (rompe `notificar`, rompe `completar`,
 *   sube al `HttpExceptionFilter`). Reservado a side-effects cuyo resultado es
 *   parte de la respuesta síncrona (ej. generación del comprobante).
 * - `'best-effort'`: su fallo NUNCA propaga; el subject lo aísla vía
 *   `Promise.allSettled` y lo registra con `logger.error`.
 */
export type ObserverFailureMode = 'critical' | 'best-effort';

/**
 * Resultado opcional que un observer puede devolver al subject. Solo el
 * observer crítico que genera el comprobante completa `comprobanteUrl`; el
 * resto retorna `void`.
 */
export interface ObserverResultado {
  readonly comprobanteUrl?: string;
}

/**
 * Contrato que deben implementar los observers de `IntercambioCompletado`.
 * Cada observer declara su `failureMode` (clasificación estática, sin
 * hardcodear nombres en el subject — mantiene OCP) y reacciona al evento
 * usando únicamente el payload recibido (cero re-fetch).
 */
export interface IIntercambioObserver {
  readonly failureMode: ObserverFailureMode;
  onIntercambioCompletado(evento: IntercambioCompletadoEvent): Promise<ObserverResultado | void>;
}

import { Injectable } from '@nestjs/common';
import { SimularMatchingDto } from './dto/simular-matching.dto';
import { SimularMatchingResponseDto } from './dto/simular-matching-response.dto';
import { IntercambiosService } from '../intercambios/intercambios.service';
import { CrearIntercambioDto } from '../intercambios/dto/crear-intercambio.dto';

/**
 * Orquesta la simulación de un matching de comisiones creando un `Intercambio`
 * REAL (ya no un stub con `intercambioId: Date.now()`):
 *
 * 1. `crearIntercambio` — registra el `Intercambio` en estado PENDIENTE
 * 2. `completar` — ejecuta la transición atómica y emite `IntercambioCompletado`
 *    a los observers (`ComprobanteObserver`, `NotificacionObserver`, `EmailObserver`)
 *    a través de `IntercambioCompletadoSubject`
 *
 * Toda la lógica de side-effects (comprobantes, notificaciones, emails) vive
 * ahora en `IntercambiosService`/observers — `MatchingService` es un orquestador
 * delgado que remapea el DTO de simulación al DTO real de creación de intercambios.
 */
@Injectable()
export class MatchingService {
  constructor(private readonly intercambiosService: IntercambiosService) {}

  async ejecutarMatching(datosSimulacion: SimularMatchingDto): Promise<SimularMatchingResponseDto> {
    const datosCreacion: CrearIntercambioDto = {
      id_usuario_ofrece: datosSimulacion.usuarioSolicitanteId,
      id_comision_ofrece: datosSimulacion.comisionOrigenId,
      id_usuario_destino: datosSimulacion.usuarioReceptorId,
      id_comision_destino: datosSimulacion.comisionDestinoId,
    };

    const intercambioCreado = await this.intercambiosService.crearIntercambio(datosCreacion);
    const { comprobante_url } = await this.intercambiosService.completar(intercambioCreado.id_intercambio);

    return {
      id_intercambio: intercambioCreado.id_intercambio,
      estado: 'COMPLETADO',
      comprobante_url,
      mensaje: 'Matching simulado correctamente',
    };
  }
}

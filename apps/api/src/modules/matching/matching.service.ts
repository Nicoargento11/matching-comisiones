import { Injectable } from '@nestjs/common';
import { SimularMatchingDto } from './dto/simular-matching.dto';
import { SimularMatchingResponseDto } from './dto/simular-matching-response.dto';
import { IntercambiosService } from '../intercambios/intercambios.service';
import { CreateIntercambioDto } from '../intercambios/dto/create-intercambio.dto';

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

  async simularMatching(dto: SimularMatchingDto): Promise<SimularMatchingResponseDto> {
    const dtoCreacion: CreateIntercambioDto = {
      id_usuario_ofrece: dto.usuarioSolicitanteId,
      id_comision_ofrece: dto.comisionOrigenId,
      id_usuario_destino: dto.usuarioReceptorId,
      id_comision_destino: dto.comisionDestinoId,
    };

    const intercambioCreado = await this.intercambiosService.crearIntercambio(dtoCreacion);
    const { comprobante_url } = await this.intercambiosService.completar(intercambioCreado.id_intercambio);

    return {
      id_intercambio: intercambioCreado.id_intercambio,
      estado: 'COMPLETADO',
      comprobante_url,
      mensaje: 'Matching simulado correctamente',
    };
  }
}

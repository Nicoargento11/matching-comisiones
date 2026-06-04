import { Injectable } from '@nestjs/common';
import { DatosComprobante } from '../comprobante.template';
import { ComprobantePdfService } from '../services/comprobante-pdf.service';
import { ComprobantesStorageService } from '../services/comprobantes-storage.service';
import {
  IMatchingObserver,
  MatchingCompletadoData,
} from '../../matching/interfaces/matching-observer.interface';

@Injectable()
export class ComprobantesMatchingObserver implements IMatchingObserver {
  constructor(
    private readonly comprobantePdfService: ComprobantePdfService,
    private readonly comprobantesStorageService: ComprobantesStorageService,
  ) {}

  async onMatchingCompleted(data: MatchingCompletadoData): Promise<void> {
    const datosSimulados: DatosComprobante = {
      idIntercambio: data.intercambioId,
      fechaGeneracion: data.completadoEn,
      alumnoOfrece: {
        nombre_usuario: `Usuario`,
        apellido_usuario: `${data.usuarioSolicitanteId}`,
        dni: 0,
      },
      comisionOfrece: {
        nombre_comision: null,
        numero_comision: data.comisionOrigenId,
        profesor: {
          nombre_usuario: 'Simulado',
          apellido_usuario: 'Simulado',
        },
      },
      alumnoDestino: {
        nombre_usuario: `Usuario`,
        apellido_usuario: `${data.usuarioReceptorId}`,
        dni: 0,
      },
      comisionDestino: {
        nombre_comision: null,
        numero_comision: data.comisionDestinoId,
        profesor: {
          nombre_usuario: 'Simulado',
          apellido_usuario: 'Simulado',
        },
      },
    };

    const pdf = await this.comprobantePdfService.generar(datosSimulados);
    const url = await this.comprobantesStorageService.subir(
      data.intercambioId,
      pdf,
    );
    console.log(
      `Comprobante generado para intercambio ${data.intercambioId}: ${url}`,
    );
  }
}

import { Injectable } from '@nestjs/common';
import { DatosComprobante } from '../comprobante.template';
import { ComprobantePdfService } from '../services/comprobante-pdf.service';
import { ComprobantesStorageService } from '../services/comprobantes-storage.service';
import {
  IMatchingObserver,
  MatchingCompletadoData,
} from '../../matching/interfaces/matching-observer.interface';
import { UsuariosRepository } from '../../usuarios/repositories/usuarios.repository';
import { ComisionesRepository } from '../../comisiones/repositories/comisiones.repository';

@Injectable()
export class ComprobantesMatchingObserver implements IMatchingObserver {
  constructor(
    private readonly comprobantePdfService: ComprobantePdfService,
    private readonly comprobantesStorageService: ComprobantesStorageService,
    private readonly usuariosRepository: UsuariosRepository,
    private readonly comisionesRepository: ComisionesRepository,
  ) {}

  async onMatchingCompleted(data: MatchingCompletadoData): Promise<void> {
    const [usuarioSolicitante, usuarioReceptor, comisionOrigen, comisionDestino] =
      await Promise.all([
        this.usuariosRepository.obtenerPorId(data.usuarioSolicitanteId),
        this.usuariosRepository.obtenerPorId(data.usuarioReceptorId),
        this.comisionesRepository.obtenerPorId(data.comisionOrigenId),
        this.comisionesRepository.obtenerPorId(data.comisionDestinoId),
      ]);

    const datosComprobante: DatosComprobante = {
      idIntercambio: data.intercambioId,
      fechaGeneracion: data.completadoEn,
      alumnoOfrece: {
        nombre_usuario: usuarioSolicitante.nombre_usuario,
        apellido_usuario: usuarioSolicitante.apellido_usuario,
        dni: usuarioSolicitante.dni,
      },
      comisionOfrece: {
        nombre_comision: comisionOrigen.nombre_comision,
        numero_comision: comisionOrigen.numero_comision,
        profesor: {
          nombre_usuario: comisionOrigen.profesor.nombre_usuario,
          apellido_usuario: comisionOrigen.profesor.apellido_usuario,
        },
      },
      alumnoDestino: {
        nombre_usuario: usuarioReceptor.nombre_usuario,
        apellido_usuario: usuarioReceptor.apellido_usuario,
        dni: usuarioReceptor.dni,
      },
      comisionDestino: {
        nombre_comision: comisionDestino.nombre_comision,
        numero_comision: comisionDestino.numero_comision,
        profesor: {
          nombre_usuario: comisionDestino.profesor.nombre_usuario,
          apellido_usuario: comisionDestino.profesor.apellido_usuario,
        },
      },
    };

    const pdf = await this.comprobantePdfService.generar(datosComprobante);
    const url = await this.comprobantesStorageService.subir(
      data.intercambioId,
      pdf,
    );
    console.log(
      `Comprobante generado para intercambio ${data.intercambioId}: ${url}`,
    );
  }
}

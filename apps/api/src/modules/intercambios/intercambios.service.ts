import { Injectable } from '@nestjs/common';
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
} from '../../common/errors/business-error';
import { IntercambiosRepository } from './repositories/intercambios.repository';
import { mapearIntercambioResponse } from './intercambios.mapper';
import { IntercambioResponseDto } from './dto/intercambio-response.dto';
import { CreateIntercambioDto } from './dto/create-intercambio.dto';

@Injectable()
export class IntercambiosService {
  constructor(private readonly intercambiosRepository: IntercambiosRepository) {}

  /**
   * Obtiene todos los intercambios del usuario autenticado
   * @param idUsuario - ID del usuario
   * @returns Lista de intercambios mapeados al DTO de respuesta
   */
  async obtenerPorUsuario(idUsuario: number): Promise<IntercambioResponseDto[]> {
    const intercambios = await this.intercambiosRepository.obtenerPorUsuario(idUsuario);
    return intercambios.map(mapearIntercambioResponse);
  }

  /**
   * Obtiene el detalle de un intercambio por ID
   * @param idIntercambio - ID del intercambio
   * @returns El intercambio mapeado
   * @throws NotFoundException si no existe
   */
  async obtenerPorId(idIntercambio: number): Promise<IntercambioResponseDto> {
    const intercambio = await this.intercambiosRepository.obtenerPorId(idIntercambio);
    if (!intercambio) {
      throw new NotFoundError('INTERCAMBIO_NO_ENCONTRADO', 'Intercambio no encontrado');
    }
    return mapearIntercambioResponse(intercambio);
  }

  /**
   * Crea un intercambio en estado PENDIENTE entre dos usuarios
   * @param dto - Datos del intercambio (quién ofrece y quién es el destino)
   * @returns El intercambio creado
   * @throws BadRequestError si alguna inscripción no está activa
   * @throws ConflictError si ya existe un intercambio pendiente igual
   */
  async crear(dto: CreateIntercambioDto): Promise<IntercambioResponseDto> {
    const inscripcionesActivas =
      await this.intercambiosRepository.verificarInscripcionesActivas(dto);
    if (!inscripcionesActivas) {
      throw new BadRequestError(
        'INTERCAMBIO_INSCRIPCIONES_INACTIVAS',
        'Ambos usuarios deben tener inscripciones activas en sus respectivas comisiones',
      );
    }

    const pendiente = await this.intercambiosRepository.buscarIntercambioPendiente(dto);
    if (pendiente) {
      throw new ConflictError(
        'INTERCAMBIO_YA_EXISTE',
        'Ya existe un intercambio pendiente entre estas comisiones',
      );
    }

    const estadoPendiente =
      await this.intercambiosRepository.buscarEstadoPorNombre('PENDIENTE');
    if (!estadoPendiente) {
      throw new NotFoundError(
        'INTERCAMBIO_ESTADO_NO_ENCONTRADO',
        'Estado PENDIENTE no configurado en la base de datos',
      );
    }

    const intercambio = await this.intercambiosRepository.crear(dto, estadoPendiente.id_estado);
    return mapearIntercambioResponse(intercambio);
  }

  /**
   * Completa un intercambio de forma atómica: intercambia las comisiones de
   * ambos usuarios y envía notificaciones a los dos.
   * @param idIntercambio - ID del intercambio a completar
   * @throws NotFoundException si no existe el intercambio
   * @throws ConflictError si el intercambio no está en estado PENDIENTE
   */
  async completar(idIntercambio: number): Promise<void> {
    const intercambio = await this.intercambiosRepository.verificarExistencia(idIntercambio);
    if (!intercambio) {
      throw new NotFoundError('INTERCAMBIO_NO_ENCONTRADO', 'Intercambio no encontrado');
    }

    const estadoActual = await this.intercambiosRepository.buscarEstadoPorNombre('PENDIENTE');
    if (!estadoActual || intercambio.id_estado !== estadoActual.id_estado) {
      throw new ConflictError(
        'INTERCAMBIO_ESTADO_INVALIDO',
        'Solo se pueden completar intercambios en estado PENDIENTE',
      );
    }

    const estadoCompletado =
      await this.intercambiosRepository.buscarEstadoPorNombre('COMPLETADO');
    if (!estadoCompletado) {
      throw new NotFoundError(
        'INTERCAMBIO_ESTADO_NO_ENCONTRADO',
        'Estado COMPLETADO no configurado en la base de datos',
      );
    }

    const notificacionOfrece = {
      titulo: 'Cambio de comisión completado',
      mensaje: `Tu intercambio de comisión fue completado exitosamente.`,
      datos: {
        id_intercambio: idIntercambio,
        id_comision: intercambio.id_comision_destino,
      },
    };

    const notificacionDestino = {
      titulo: 'Cambio de comisión completado',
      mensaje: `Tu intercambio de comisión fue completado exitosamente.`,
      datos: {
        id_intercambio: idIntercambio,
        id_comision: intercambio.id_comision_ofrece,
      },
    };

    await this.intercambiosRepository.completarAtomico(
      idIntercambio,
      intercambio,
      estadoCompletado.id_estado,
      notificacionOfrece,
      notificacionDestino,
    );
  }
}

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
import { CandidatosIntercambioDto } from './dto/candidatos-intercambio.dto';
import { IntercambioCompletadoSubject } from './observers/intercambio-completado.subject';
import { IntercambioCompletadoEvent } from './events/intercambio-completado.event';

/**
 * Resultado de `completar`: lo mínimo que el caller necesita de forma síncrona
 * para construir su propia respuesta (ej. `SimularMatchingResponseDto`).
 */
export interface CompletarResultado {
  readonly id_intercambio: number;
  readonly comprobante_url: string;
}

@Injectable()
export class IntercambiosService {
  constructor(
    private readonly intercambiosRepository: IntercambiosRepository,
    private readonly subject: IntercambioCompletadoSubject,
  ) {}

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
   * Busca candidatos válidos para intercambiar con el solicitante: alumnos con
   * inscripción activa en otras comisiones de la misma materia que la comisión origen
   * @param dto - Comisión origen y usuario solicitante (se excluye de los resultados)
   * @returns Lista de candidatos (usuario + su comisión)
   * @throws NotFoundException si la comisión origen no existe
   */
  async obtenerCandidatos(dto: CandidatosIntercambioDto) {
    const candidatos = await this.intercambiosRepository.obtenerCandidatos(
      dto.id_comision_origen,
      dto.id_usuario_solicitante,
    );
    if (candidatos === null) {
      throw new NotFoundError('COMISION_NO_ENCONTRADA', 'La comisión origen no existe');
    }
    return candidatos;
  }

  /**
   * Crea un intercambio en estado PENDIENTE entre dos usuarios
   * @param dto - Datos del intercambio (quién ofrece y quién es el destino)
   * @returns El intercambio creado
   * @throws BadRequestError si alguna inscripción no está activa
   * @throws ConflictError si ya existe un intercambio pendiente igual
   */
  async crearIntercambio(dto: CreateIntercambioDto): Promise<IntercambioResponseDto> {
    const inscripcionesActivas =
      await this.intercambiosRepository.verificarInscripcionesActivas(dto);
    if (!inscripcionesActivas) {
      throw new BadRequestError(
        'INTERCAMBIO_INSCRIPCIONES_INACTIVAS',
        'Ambos usuarios deben tener inscripciones activas en sus respectivas comisiones',
      );
    }

    const mismaMateria = await this.intercambiosRepository.verificarMismaMateria(
      dto.id_comision_ofrece,
      dto.id_comision_destino,
    );
    if (!mismaMateria) {
      throw new BadRequestError(
        'INTERCAMBIO_MATERIAS_DISTINTAS',
        'Las comisiones del intercambio deben pertenecer a la misma materia',
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

    const intercambio = await this.intercambiosRepository.crearIntercambio(dto, estadoPendiente.id_estado);
    return mapearIntercambioResponse(intercambio);
  }

  /**
   * Completa un intercambio: valida su estado, ejecuta la transición atómica
   * (cambio de estado + intercambio de comisiones) y emite `IntercambioCompletado`
   * para que los observers (`ComprobanteObserver`, `NotificacionObserver`,
   * `EmailObserver`) reaccionen con sus side-effects.
   *
   * `completar` YA NO construye notificaciones, genera PDFs, sube a storage,
   * persiste comprobantes ni envía emails — esa responsabilidad se distribuyó
   * en observers suscritos al evento de dominio (Observer Pattern, ver
   * `IntercambioCompletadoSubject`).
   *
   * Orden de fallas y aislamiento:
   * - Validaciones (existencia, estado PENDIENTE, estado COMPLETADO configurado)
   *   lanzan ANTES de cualquier side-effect — sin transacción, sin evento.
   * - `completarIntercambio` es la única operación transaccional: si falla, nada
   *   más corre.
   * - Tras el commit, `subject.notificar` ejecuta primero el observer crítico
   *   (`ComprobanteObserver`). Si falla, se ejecuta `revertirIntercambio` para
   *   deshacer el swap de forma atómica y se propaga el error.
   * - Luego corren los observers best-effort (`NotificacionObserver`,
   *   `EmailObserver`) vía `Promise.allSettled`, aislados entre sí.
   *
   * @param idIntercambio - ID del intercambio a completar
   * @returns `{ id_intercambio, comprobante_url }` para que el caller construya su respuesta
   * @throws NotFoundException si no existe el intercambio o no está configurado el estado COMPLETADO
   * @throws ConflictError si el intercambio no está en estado PENDIENTE
   */
  async completar(idIntercambio: number): Promise<CompletarResultado> {
    const datos = await this.intercambiosRepository.obtenerDatosCompletos(idIntercambio);
    if (!datos) {
      throw new NotFoundError('INTERCAMBIO_NO_ENCONTRADO', 'Intercambio no encontrado');
    }

    const estadoPendiente = await this.intercambiosRepository.buscarEstadoPorNombre('PENDIENTE');
    if (!estadoPendiente || datos.id_estado !== estadoPendiente.id_estado) {
      throw new ConflictError(
        'INTERCAMBIO_ESTADO_INVALIDO',
        'Solo se pueden completar intercambios en estado PENDIENTE',
      );
    }

    const estadoCompletado = await this.intercambiosRepository.buscarEstadoPorNombre('COMPLETADO');
    if (!estadoCompletado) {
      throw new NotFoundError(
        'INTERCAMBIO_ESTADO_NO_ENCONTRADO',
        'Estado COMPLETADO no configurado en la base de datos',
      );
    }

    await this.intercambiosRepository.completarIntercambio(
      idIntercambio,
      {
        id_usuario_ofrece: datos.ofrece.usuario.id_usuario,
        id_comision_ofrece: datos.id_comision_ofrece,
        id_usuario_destino: datos.destino.usuario.id_usuario,
        id_comision_destino: datos.id_comision_destino,
      },
      estadoCompletado.id_estado,
    );

    const evento: IntercambioCompletadoEvent = {
      id_intercambio: idIntercambio,
      id_comision_ofrece: datos.id_comision_ofrece,
      id_comision_destino: datos.id_comision_destino,
      completadoEn: new Date(),
      ofrece: datos.ofrece,
      destino: datos.destino,
    };

    try {
      const { comprobanteUrl } = await this.subject.notificar(evento);
      return { id_intercambio: idIntercambio, comprobante_url: comprobanteUrl };
    } catch (error) {
      await this.intercambiosRepository.revertirIntercambio(
        idIntercambio,
        estadoPendiente.id_estado,
        {
          id_usuario_ofrece: datos.ofrece.usuario.id_usuario,
          id_comision_ofrece: datos.id_comision_ofrece,
          id_usuario_destino: datos.destino.usuario.id_usuario,
          id_comision_destino: datos.id_comision_destino,
        },
      );
      throw error;
    }
  }
}

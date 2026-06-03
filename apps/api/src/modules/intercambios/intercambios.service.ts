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
   * ambos usuarios y envía notificaciones a los alumnos y profesores involucrados.
   * @param idIntercambio - ID del intercambio a completar
   * @throws NotFoundException si no existe el intercambio
   * @throws ConflictError si el intercambio no está en estado PENDIENTE
   */
  async completar(idIntercambio: number): Promise<void> {
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

    const nombreComisionOfrece =
      datos.ofrece.comision.nombre_comision ?? `Comisión ${datos.ofrece.comision.numero_comision}`;
    const nombreComisionDestino =
      datos.destino.comision.nombre_comision ?? `Comisión ${datos.destino.comision.numero_comision}`;

    const todasLasNotificaciones = [
      {
        id_usuario: datos.ofrece.usuario.id_usuario,
        tipo: 'MATCHING_COMISION' as const,
        titulo: 'Cambio de comisión completado',
        mensaje: 'Tu intercambio de comisión fue completado exitosamente.',
        datos: { id_intercambio: idIntercambio, id_comision: datos.id_comision_destino },
      },
      {
        id_usuario: datos.destino.usuario.id_usuario,
        tipo: 'MATCHING_COMISION' as const,
        titulo: 'Cambio de comisión completado',
        mensaje: 'Tu intercambio de comisión fue completado exitosamente.',
        datos: { id_intercambio: idIntercambio, id_comision: datos.id_comision_ofrece },
      },
      {
        id_usuario: datos.ofrece.comision.profesor.id_usuario,
        tipo: 'INTERCAMBIO_EN_COMISION' as const,
        titulo: 'Intercambio de alumnos en tu comisión',
        mensaje: `${datos.ofrece.usuario.nombre_usuario} ${datos.ofrece.usuario.apellido_usuario} (DNI ${datos.ofrece.usuario.dni}) salió de tu comisión y fue reemplazado por ${datos.destino.usuario.nombre_usuario} ${datos.destino.usuario.apellido_usuario} (DNI ${datos.destino.usuario.dni}), proveniente de ${nombreComisionDestino} (Prof. ${datos.destino.comision.profesor.nombre_usuario} ${datos.destino.comision.profesor.apellido_usuario}).`,
        datos: {
          alumno_sale: { nombre_usuario: datos.ofrece.usuario.nombre_usuario, apellido_usuario: datos.ofrece.usuario.apellido_usuario, dni: datos.ofrece.usuario.dni },
          alumno_entra: { nombre_usuario: datos.destino.usuario.nombre_usuario, apellido_usuario: datos.destino.usuario.apellido_usuario, dni: datos.destino.usuario.dni },
          comision_origen: { id_comision: datos.id_comision_ofrece, nombre: nombreComisionOfrece },
          comision_destino: { id_comision: datos.id_comision_destino, nombre: nombreComisionDestino },
          profesor_otra_comision: { nombre_usuario: datos.destino.comision.profesor.nombre_usuario, apellido_usuario: datos.destino.comision.profesor.apellido_usuario },
        },
      },
      {
        id_usuario: datos.destino.comision.profesor.id_usuario,
        tipo: 'INTERCAMBIO_EN_COMISION' as const,
        titulo: 'Intercambio de alumnos en tu comisión',
        mensaje: `${datos.destino.usuario.nombre_usuario} ${datos.destino.usuario.apellido_usuario} (DNI ${datos.destino.usuario.dni}) salió de tu comisión y fue reemplazado por ${datos.ofrece.usuario.nombre_usuario} ${datos.ofrece.usuario.apellido_usuario} (DNI ${datos.ofrece.usuario.dni}), proveniente de ${nombreComisionOfrece} (Prof. ${datos.ofrece.comision.profesor.nombre_usuario} ${datos.ofrece.comision.profesor.apellido_usuario}).`,
        datos: {
          alumno_sale: { nombre_usuario: datos.destino.usuario.nombre_usuario, apellido_usuario: datos.destino.usuario.apellido_usuario, dni: datos.destino.usuario.dni },
          alumno_entra: { nombre_usuario: datos.ofrece.usuario.nombre_usuario, apellido_usuario: datos.ofrece.usuario.apellido_usuario, dni: datos.ofrece.usuario.dni },
          comision_origen: { id_comision: datos.id_comision_destino, nombre: nombreComisionDestino },
          comision_destino: { id_comision: datos.id_comision_ofrece, nombre: nombreComisionOfrece },
          profesor_otra_comision: { nombre_usuario: datos.ofrece.comision.profesor.nombre_usuario, apellido_usuario: datos.ofrece.comision.profesor.apellido_usuario },
        },
      },
    ];

    const seen = new Set<number>();
    const notificaciones = todasLasNotificaciones.filter((n) => {
      if (seen.has(n.id_usuario)) return false;
      seen.add(n.id_usuario);
      return true;
    });

    await this.intercambiosRepository.completarAtomico(
      idIntercambio,
      {
        id_usuario_ofrece: datos.ofrece.usuario.id_usuario,
        id_comision_ofrece: datos.id_comision_ofrece,
        id_usuario_destino: datos.destino.usuario.id_usuario,
        id_comision_destino: datos.id_comision_destino,
      },
      estadoCompletado.id_estado,
      notificaciones,
    );
  }
}

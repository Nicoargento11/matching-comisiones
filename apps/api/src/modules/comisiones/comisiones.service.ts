import { Injectable } from '@nestjs/common';
import {
  NotFoundError,
  ConflictError,
  ForbiddenError,
  BadRequestError,
} from '../../common/errors/business-error';
import { ComisionesRepository } from './repositories/comisiones.repository';
import { mapearComisionResponse } from './comisiones.mapper';
import { ComisionResponseDto } from './dto/comision-response.dto';
import { AddEstudianteDto } from './dto/add-estudiante.dto';
import { CreateHorarioDto } from './dto/create-horario.dto';
import { CreateEventoDto } from './dto/create-evento.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';
import { PaginacionDto } from '../../common/dto/paginacion.dto';
import { verificarOExcepcion } from '../../common/helpers/verificar-existencia';
import {
  construirPaginacion,
  construirMetaPaginacion,
} from '../../common/helpers/paginacion';

@Injectable()
export class ComisionesService {
  constructor(private readonly comisionesRepository: ComisionesRepository) {}

  /**
   * Obtiene todas las comisiones con paginación
   * @param paginacionDto - DTO de paginación con pagina, limite, ordenarPor y direccion
   * @returns Objeto con data (lista de comisiones) y meta (info de paginación)
   */
  async obtenerTodas(paginacionDto: PaginacionDto): Promise<{
    data: ComisionResponseDto[];
    meta: ReturnType<typeof construirMetaPaginacion>;
  }> {
    const paginacion = construirPaginacion(paginacionDto, [
      'numero_comision',
      'nombre_comision',
      'cupo_maximo',
    ]);
    const [raw, total] = await Promise.all([
      this.comisionesRepository.obtenerTodas(paginacion),
      this.comisionesRepository.contar(),
    ]);
    return {
      data: raw.map(mapearComisionResponse),
      meta: construirMetaPaginacion(total, paginacionDto),
    };
  }

  /**
   * Verifica que exista una comisión por su ID
   * @param idComision - ID de la comisión a verificar
   * @returns La comisión encontrada
   * @throws NotFoundException si no existe la comisión
   */
  private async verificarComision(idComision: number) {
    return verificarOExcepcion(
      () => this.comisionesRepository.verificarExistencia(idComision),
      'comisión',
      idComision,
    );
  }

  /**
   * Obtiene el detalle completo de una comisión
   * @param idComision - ID de la comisión
   * @returns Datos de la comisión con horarios, estudiantes y eventos
   * @throws NotFoundException si no existe la comisión
   */
  async obtenerDetalleComision(
    idComision: number,
  ): Promise<ComisionResponseDto> {
    const comision = await verificarOExcepcion(
      () => this.comisionesRepository.obtenerPorId(idComision),
      'comisión',
      idComision,
    );
    return mapearComisionResponse(comision);
  }

  /**
   * Obtiene las comisiones en las que está inscrito un usuario
   * @param idUsuario - ID del usuario
   * @returns Lista de inscripciones con datos de comisión
   * @throws NotFoundException si no existe el usuario
   */
  async obtenerComisionesDeUsuario(idUsuario: number) {
    await verificarOExcepcion(
      () => this.comisionesRepository.verificarExistenciaUsuario(idUsuario),
      'estudiante',
      idUsuario,
    );
    return this.comisionesRepository.obtenerComisionesDeUsuario(idUsuario);
  }

  /**
   * Incorpora un estudiante a una comisión
   * @param idComision - ID de la comisión
   * @param dto - Datos del estudiante a incorporar
   * @returns La inscripción creada o reactivada
   * @throws NotFoundException si no existe la comisión
   * @throws ConflictException si el estudiante ya está activo en la comisión
   */
  async agregarEstudiante(idComision: number, dto: AddEstudianteDto) {
    const comision = await this.verificarComision(idComision);

    const esEstudiante = await this.comisionesRepository.verificarEsEstudiante(
      dto.id_usuario,
    );
    if (!esEstudiante) {
      throw new ForbiddenError(
        'USUARIO_NO_ES_ESTUDIANTE',
        'Solo se pueden inscribir usuarios con rol estudiante',
      );
    }

    const conflicto =
      await this.comisionesRepository.buscarInscripcionActivaEnMateria(
        dto.id_usuario,
        comision.id_materia,
      );
    if (conflicto) {
      const nombre =
        conflicto.comision.nombre_comision ??
        `Comisión ${conflicto.comision.numero_comision}`;
      throw new ConflictError(
        'COMISION_CONFLICTO_MATERIA',
        `El alumno ya está inscripto en "${nombre}" de esta materia`,
      );
    }

    const existing = await this.comisionesRepository.buscarInscripcion(
      dto.id_usuario,
      idComision,
    );
    if (existing && existing.estado === 'ACTIVO') {
      throw new ConflictError(
        'COMISION_YA_INSCRITO',
        'El estudiante ya está activo en la comisión',
      );
    }
    if (existing) {
      return this.comisionesRepository.reactivarInscripcion(
        dto.id_usuario,
        idComision,
      );
    }
    return this.comisionesRepository.crearInscripcion(
      dto.id_usuario,
      idComision,
    );
  }

  /**
   * Da de baja un estudiante de una comisión (cambia estado a BAJA)
   * @param idComision - ID de la comisión
   * @param idUsuario - ID del usuario a dar de baja
   * @throws NotFoundException si no existe la comisión o la inscripción
   */
  async darBajaEstudiante(idComision: number, idUsuario: number) {
    await this.verificarComision(idComision);
    const inscripcion = await this.comisionesRepository.buscarInscripcion(
      idUsuario,
      idComision,
    );
    if (!inscripcion) {
      throw new NotFoundError(
        'COMISION_INSCRIPCION_NO_ENCONTRADA',
        'El estudiante no está en esta comisión',
      );
    }
    await this.comisionesRepository.darBajaInscripcion(idUsuario, idComision);
  }

  /**
   * Agrega un horario a una comisión
   * @param idComision - ID de la comisión
   * @param dto - Datos del horario a crear
   * @returns El horario creado con relaciones
   * @throws NotFoundException si no existe la comisión, el día o la modalidad
   */
  async agregarHorario(idComision: number, dto: CreateHorarioDto) {
    if (dto.hora_fin <= dto.hora_inicio) {
      throw new BadRequestError(
        'HORARIO_HORA_INVALIDA',
        'hora_fin debe ser posterior a hora_inicio',
      );
    }
    await this.verificarComision(idComision);

    const dia = await this.comisionesRepository.buscarDiaPorNombre(
      dto.nombre_dia,
    );
    if (!dia) {
      throw new NotFoundError(
        'COMISION_DIA_NO_ENCONTRADO',
        `No existe el día "${dto.nombre_dia}"`,
      );
    }

    const modalidad = await this.comisionesRepository.buscarModalidadPorNombre(
      dto.nombre_modalidad,
    );
    if (!modalidad) {
      throw new NotFoundError(
        'COMISION_MODALIDAD_NO_ENCONTRADA',
        `No existe la modalidad "${dto.nombre_modalidad}"`,
      );
    }

    const horariosExistentes =
      await this.comisionesRepository.obtenerHorariosActivosPorDia(
        idComision,
        dia.numero_dia,
      );
    for (const h of horariosExistentes) {
      if (dto.hora_inicio < h.hora_fin && dto.hora_fin > h.hora_inicio) {
        throw new ConflictError(
          'HORARIO_SOLAPAMIENTO',
          `El horario se solapa con uno existente (${h.hora_inicio}-${h.hora_fin})`,
        );
      }
    }

    return this.comisionesRepository.ejecutarTransaccion(async (tx) => {
      let id_aula: number | undefined;
      if (dto.nombre_aula?.trim()) {
        const aula = await this.comisionesRepository.upsertAula(
          tx,
          dto.nombre_aula.trim(),
        );
        id_aula = aula.id_aula;
      }

      return this.comisionesRepository.crearHorario(tx, {
        hora_inicio: dto.hora_inicio,
        hora_fin: dto.hora_fin,
        numero_dia: dia.numero_dia,
        id_modalidad: modalidad.id_modalidad,
        formato: dto.formato ?? 'TEORICO_PRACTICO',
        id_comision: idComision,
        ...(id_aula !== undefined && { id_aula }),
      });
    });
  }

  /**
   * Realiza soft-delete de un horario (activo = false)
   * @param idComision - ID de la comisión
   * @param idHorario - ID del horario a eliminar
   * @throws NotFoundException si el horario no pertenece a la comisión
   */
  async eliminarHorario(idComision: number, idHorario: number) {
    const horario = await this.comisionesRepository.buscarHorario(
      idHorario,
      idComision,
    );
    if (!horario) {
      throw new NotFoundError(
        'COMISION_HORARIO_NO_ENCONTRADO',
        'Horario no encontrado en esta comisión',
      );
    }
    await this.comisionesRepository.desactivarHorario(idHorario);
  }

  /**
   * Reactiva un horario que fue dado de baja
   * @param idComision - ID de la comisión
   * @param idHorario - ID del horario a reactivar
   * @returns El horario reactivado con relaciones
   * @throws NotFoundException si el horario no pertenece a la comisión
   */
  async reactivarHorario(idComision: number, idHorario: number) {
    const horario = await this.comisionesRepository.buscarHorario(
      idHorario,
      idComision,
    );
    if (!horario) {
      throw new NotFoundError(
        'COMISION_HORARIO_NO_ENCONTRADO',
        'Horario no encontrado en esta comisión',
      );
    }
    return this.comisionesRepository.reactivarHorario(idHorario);
  }

  /**
   * Agrega un evento a una comisión
   * @param idComision - ID de la comisión
   * @param dto - Datos del evento a crear
   * @returns El evento creado
   * @throws NotFoundException si no existe la comisión
   */
  async agregarEvento(idComision: number, dto: CreateEventoDto) {
    if (new Date(dto.fecha_fin) <= new Date(dto.fecha_inicio)) {
      throw new BadRequestError(
        'EVENTO_FECHA_INVALIDA',
        'fecha_fin debe ser posterior a fecha_inicio',
      );
    }
    await this.verificarComision(idComision);
    return this.comisionesRepository.crearEvento(idComision, dto);
  }

  /**
   * Modifica un evento existente de una comisión
   * @param idComision - ID de la comisión
   * @param idEvento - ID del evento a modificar
   * @param dto - Datos parciales a actualizar
   * @returns El evento actualizado
   * @throws NotFoundException si el evento no pertenece a la comisión
   */
  async modificarEvento(
    idComision: number,
    idEvento: number,
    dto: UpdateEventoDto,
  ) {
    if (
      dto.fecha_inicio &&
      dto.fecha_fin &&
      new Date(dto.fecha_fin) <= new Date(dto.fecha_inicio)
    ) {
      throw new BadRequestError(
        'EVENTO_FECHA_INVALIDA',
        'fecha_fin debe ser posterior a fecha_inicio',
      );
    }
    const evento = await this.comisionesRepository.buscarEvento(
      idEvento,
      idComision,
    );
    if (!evento) {
      throw new NotFoundError(
        'COMISION_EVENTO_NO_ENCONTRADO',
        'Evento no encontrado en esta comisión',
      );
    }
    return this.comisionesRepository.modificarEvento(idEvento, dto);
  }

  /**
   * Realiza soft-delete de un evento (activo = false)
   * @param idComision - ID de la comisión
   * @param idEvento - ID del evento a eliminar
   * @throws NotFoundException si el evento no pertenece a la comisión
   */
  async eliminarEvento(idComision: number, idEvento: number) {
    const evento = await this.comisionesRepository.buscarEvento(
      idEvento,
      idComision,
    );
    if (!evento) {
      throw new NotFoundError(
        'COMISION_EVENTO_NO_ENCONTRADO',
        'Evento no encontrado en esta comisión',
      );
    }
    await this.comisionesRepository.desactivarEvento(idEvento);
  }

  /**
   * Reactiva un evento que fue dado de baja
   * @param idComision - ID de la comisión
   * @param idEvento - ID del evento a reactivar
   * @returns El evento reactivado
   * @throws NotFoundException si el evento no pertenece a la comisión
   */
  async reactivarEvento(idComision: number, idEvento: number) {
    const evento = await this.comisionesRepository.buscarEvento(
      idEvento,
      idComision,
    );
    if (!evento) {
      throw new NotFoundError(
        'COMISION_EVENTO_NO_ENCONTRADO',
        'Evento no encontrado en esta comisión',
      );
    }
    return this.comisionesRepository.reactivarEvento(idEvento);
  }

  /**
   * Verifica que el usuario autenticado sea el profesor de la comisión (CO-01/CO-02)
   * @param supabaseAuthId - ID de autenticación Supabase del usuario
   * @param idComision - ID de la comisión a verificar
   * @throws ForbiddenError si el usuario no es el profesor asignado
   */
  async verificarProfesorDeComision(
    supabaseAuthId: string,
    idComision: number,
  ): Promise<void> {
    const comision =
      await this.comisionesRepository.buscarComisionConProfesor(idComision);
    if (!comision) return;
    if (comision.profesor.supabase_auth_id !== supabaseAuthId) {
      throw new ForbiddenError(
        'COMISION_SIN_PROFESOR',
        'Solo el profesor asignado a esta comisión puede realizar esta operación',
      );
    }
  }

  /**
   * Traslada un estudiante de su comisión actual a una nueva, de forma atómica.
   * Realiza la baja en la comisión origen y el alta en la destino en una sola transacción.
   * @param idComisionDestino - ID de la comisión de destino
   * @param idUsuario - ID del usuario a trasladar
   * @throws NotFoundException si no existe la comisión destino
   * @throws NotFoundError si el alumno no tiene inscripción activa en la materia
   */
  async trasladarEstudiante(
    idComisionDestino: number,
    idUsuario: number,
  ): Promise<void> {
    const comisionDestino = await this.verificarComision(idComisionDestino);

    const inscripcionOrigen =
      await this.comisionesRepository.buscarInscripcionActivaEnMateria(
        idUsuario,
        comisionDestino.id_materia,
      );
    if (!inscripcionOrigen) {
      throw new NotFoundError(
        'COMISION_INSCRIPCION_NO_ENCONTRADA',
        'El alumno no tiene inscripción activa en esta materia para trasladar',
      );
    }

    await this.comisionesRepository.ejecutarTransaccion(async (tx) => {
      await tx.usuarioComision.update({
        where: {
          id_usuario_id_comision: {
            id_usuario: idUsuario,
            id_comision: inscripcionOrigen.id_comision,
          },
        },
        data: { estado: 'BAJA' },
      });

      const existeEnDestino = await tx.usuarioComision.findUnique({
        where: {
          id_usuario_id_comision: {
            id_usuario: idUsuario,
            id_comision: idComisionDestino,
          },
        },
      });

      if (existeEnDestino) {
        await tx.usuarioComision.update({
          where: {
            id_usuario_id_comision: {
              id_usuario: idUsuario,
              id_comision: idComisionDestino,
            },
          },
          data: { estado: 'ACTIVO' },
        });
      } else {
        await tx.usuarioComision.create({
          data: {
            id_usuario: idUsuario,
            id_comision: idComisionDestino,
            estado: 'ACTIVO',
          },
        });
      }
    });
  }
}

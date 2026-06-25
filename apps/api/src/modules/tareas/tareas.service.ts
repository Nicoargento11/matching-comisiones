import { Injectable } from '@nestjs/common';
import { PrioridadTarea } from '@prisma/client';
import { BadRequestError } from '../../common/errors/business-error';
import { TareasRepository } from './repositories/tareas.repository';
import { mapearTareaTableroResponse, ESTADO_A_COLUMNA } from './tareas.mapper';
import { TareaTableroResponseDto } from './dto/tarea-response.dto';
import { CrearTareaDto } from './dto/crear-tarea.dto';
import { ActualizarTareaDto } from './dto/actualizar-tarea.dto';
import { ForbiddenError } from '../../common/errors/business-error';

@Injectable()
export class TareasService {
  constructor(private readonly tareasRepository: TareasRepository) {}

  async obtenerPorUsuario(idUsuario: number): Promise<TareaTableroResponseDto[]> {
    const tareas = await this.tareasRepository.obtenerPorUsuario(idUsuario);
    return tareas.map(mapearTareaTableroResponse);
  }

  async crearTarea(idUsuario: number, datosTarea: CrearTareaDto): Promise<TareaTableroResponseDto> {
    const nombreColumna = ESTADO_A_COLUMNA[datosTarea.estado] ?? datosTarea.estado;
    const columna = await this.tareasRepository.obtenerColumnaPorNombre(nombreColumna, idUsuario);

    if (!columna) {
      throw new BadRequestError(
        'COLUMNA_NO_ENCONTRADA',
        `No existe la columna "${nombreColumna}"`,
      );
    }

    const tarea = await this.tareasRepository.crearTarea(idUsuario, {
      titulo: datosTarea.titulo,
      prioridad: datosTarea.prioridad as PrioridadTarea,
      id_columna: columna.id_columna,
      descripcion: datosTarea.descripcion,
      estimacion_min: datosTarea.estimacion_min,
      id_materia: datosTarea.id_materia,
      id_evento: datosTarea.id_evento,
      fecha_vencimiento: datosTarea.fecha_vencimiento ? new Date(datosTarea.fecha_vencimiento) : undefined,
    });

    return mapearTareaTableroResponse(tarea);
  }

  async moverAColumna(
    idTarea: number,
    estado: string,
    idUsuario: number,
  ): Promise<TareaTableroResponseDto> {
    const nombreColumna = ESTADO_A_COLUMNA[estado] ?? estado;
    const columna = await this.tareasRepository.obtenerColumnaPorNombre(nombreColumna, idUsuario);

    if (!columna) {
      throw new BadRequestError(
        'COLUMNA_NO_ENCONTRADA',
        `No existe la columna "${nombreColumna}"`,
      );
    }

    const resultado = await this.tareasRepository.moverAColumna(
      idTarea,
      idUsuario,
      columna.id_columna,
    );

    if (resultado.count === 0) {
      throw new ForbiddenError(
        'TAREA_NO_AUTORIZADA',
        'No tenés permiso para modificar esta tarea',
      );
    }

    const actualizada = await this.tareasRepository.obtenerPorId(idTarea);
    return mapearTareaTableroResponse(actualizada!);
  }

  async actualizarTarea(idTarea: number, idUsuario: number, datosActualizacion: ActualizarTareaDto): Promise<TareaTableroResponseDto> {
    const resultado = await this.tareasRepository.actualizarTarea(idTarea, idUsuario, {
      titulo: datosActualizacion.titulo,
      prioridad: datosActualizacion.prioridad as PrioridadTarea,
      descripcion: datosActualizacion.descripcion ?? null,
      estimacion_min: datosActualizacion.estimacion_min ?? null,
      id_materia: datosActualizacion.id_materia ?? null,
      id_evento: datosActualizacion.id_evento ?? null,
    });

    if (resultado.count === 0) {
      throw new ForbiddenError(
        'TAREA_NO_AUTORIZADA',
        'No tenés permiso para modificar esta tarea',
      );
    }

    const actualizada = await this.tareasRepository.obtenerPorId(idTarea);
    return mapearTareaTableroResponse(actualizada!);
  }

  async eliminarTarea(idTarea: number, idUsuario: number): Promise<void> {
    const resultado = await this.tareasRepository.eliminarTarea(idTarea, idUsuario);

    if (resultado.count === 0) {
      throw new ForbiddenError(
        'TAREA_NO_AUTORIZADA',
        'No tenés permiso para eliminar esta tarea',
      );
    }
  }
}

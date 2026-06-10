import { Injectable } from '@nestjs/common';
import { PrioridadTarea } from '@prisma/client';
import { BadRequestError } from '../../common/errors/business-error';
import { TareasRepository } from './repositories/tareas.repository';
import { mapearTareaTableroResponse, ESTADO_A_COLUMNA } from './tareas.mapper';
import { TareaTableroResponseDto } from './dto/tarea-response.dto';
import { CreateTareaDto } from './dto/create-tarea.dto';
import { UpdateTareaDto } from './dto/update-tarea.dto';
import { ForbiddenError } from '../../common/errors/business-error';

@Injectable()
export class TareasService {
  constructor(private readonly tareasRepository: TareasRepository) {}

  async obtenerPorUsuario(idUsuario: number): Promise<TareaTableroResponseDto[]> {
    const tareas = await this.tareasRepository.obtenerPorUsuario(idUsuario);
    return tareas.map(mapearTareaTableroResponse);
  }

  async crearTarea(idUsuario: number, dto: CreateTareaDto): Promise<TareaTableroResponseDto> {
    const nombreColumna = ESTADO_A_COLUMNA[dto.estado] ?? dto.estado;
    const columna = await this.tareasRepository.obtenerColumnaPorNombre(nombreColumna, idUsuario);

    if (!columna) {
      throw new BadRequestError(
        'COLUMNA_NO_ENCONTRADA',
        `No existe la columna "${nombreColumna}"`,
      );
    }

    const tarea = await this.tareasRepository.crearTarea(idUsuario, {
      titulo: dto.titulo,
      prioridad: dto.prioridad as PrioridadTarea,
      id_columna: columna.id_columna,
      descripcion: dto.descripcion,
      estimacion_min: dto.estimacion_min,
      id_materia: dto.id_materia,
      id_evento: dto.id_evento,
      fecha_vencimiento: dto.fecha_vencimiento ? new Date(dto.fecha_vencimiento) : undefined,
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

    const result = await this.tareasRepository.moverAColumna(
      idTarea,
      idUsuario,
      columna.id_columna,
    );

    if (result.count === 0) {
      throw new ForbiddenError(
        'TAREA_NO_AUTORIZADA',
        'No tenés permiso para modificar esta tarea',
      );
    }

    const actualizada = await this.tareasRepository.obtenerPorId(idTarea);
    return mapearTareaTableroResponse(actualizada!);
  }

  async actualizarTarea(idTarea: number, idUsuario: number, dto: UpdateTareaDto): Promise<TareaTableroResponseDto> {
    const result = await this.tareasRepository.actualizarTarea(idTarea, idUsuario, {
      titulo: dto.titulo,
      prioridad: dto.prioridad as PrioridadTarea,
      descripcion: dto.descripcion ?? null,
      estimacion_min: dto.estimacion_min ?? null,
      id_materia: dto.id_materia ?? null,
      id_evento: dto.id_evento ?? null,
    });

    if (result.count === 0) {
      throw new ForbiddenError(
        'TAREA_NO_AUTORIZADA',
        'No tenés permiso para modificar esta tarea',
      );
    }

    const actualizada = await this.tareasRepository.obtenerPorId(idTarea);
    return mapearTareaTableroResponse(actualizada!);
  }

  async eliminarTarea(idTarea: number, idUsuario: number): Promise<void> {
    const result = await this.tareasRepository.eliminarTarea(idTarea, idUsuario);

    if (result.count === 0) {
      throw new ForbiddenError(
        'TAREA_NO_AUTORIZADA',
        'No tenés permiso para eliminar esta tarea',
      );
    }
  }
}

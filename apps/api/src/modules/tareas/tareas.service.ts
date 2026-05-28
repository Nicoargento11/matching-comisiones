import { Injectable } from '@nestjs/common';
import { PrioridadTarea } from '@prisma/client';
import { BadRequestError } from '../../common/errors/business-error';
import { TareasRepository } from './repositories/tareas.repository';
import { mapearTareaTableroResponse, ESTADO_A_COLUMNA } from './tareas.mapper';
import { TareaTableroResponseDto } from './dto/tarea-response.dto';
import { CreateTareaDto } from './dto/create-tarea.dto';
import { ForbiddenError } from '../../common/errors/business-error';

@Injectable()
export class TareasService {
  constructor(private readonly tareasRepository: TareasRepository) {}

  async obtenerPorUsuario(idUsuario: number): Promise<TareaTableroResponseDto[]> {
    const tareas = await this.tareasRepository.obtenerPorUsuario(idUsuario);
    return tareas.map(mapearTareaTableroResponse);
  }

  async crear(idUsuario: number, dto: CreateTareaDto): Promise<TareaTableroResponseDto> {
    const nombreColumna = ESTADO_A_COLUMNA[dto.estado];
    const columna = await this.tareasRepository.obtenerColumnaPorNombre(nombreColumna);

    if (!columna) {
      throw new BadRequestError(
        'COLUMNA_NO_ENCONTRADA',
        `No existe la columna "${nombreColumna}"`,
      );
    }

    const tarea = await this.tareasRepository.crear(idUsuario, {
      titulo: dto.titulo,
      prioridad: dto.prioridad as PrioridadTarea,
      id_columna: columna.id_columna,
      descripcion: dto.descripcion,
    });

    return mapearTareaTableroResponse(tarea);
  }

  async actualizarEstado(
    idTarea: number,
    estado: string,
    idUsuario: number,
  ): Promise<TareaTableroResponseDto> {
    const nombreColumna = ESTADO_A_COLUMNA[estado];
    const columna = await this.tareasRepository.obtenerColumnaPorNombre(nombreColumna);

    if (!columna) {
      throw new BadRequestError(
        'COLUMNA_NO_ENCONTRADA',
        `No existe la columna "${nombreColumna}"`,
      );
    }

    const result = await this.tareasRepository.actualizarEstado(
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

  async eliminar(idTarea: number, idUsuario: number): Promise<void> {
    const result = await this.tareasRepository.eliminar(idTarea, idUsuario);

    if (result.count === 0) {
      throw new ForbiddenError(
        'TAREA_NO_AUTORIZADA',
        'No tenés permiso para eliminar esta tarea',
      );
    }
  }
}

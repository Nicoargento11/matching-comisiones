import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { BadRequestError, ForbiddenError } from '../../common/errors/business-error';
import { ColumnasRepository } from './repositories/columnas.repository';
import { CrearColumnaDto } from './dto/crear-columna.dto';
import { ColumnaResponseDto } from './dto/columna-response.dto';

@Injectable()
export class ColumnasService {
  constructor(private readonly columnasRepository: ColumnasRepository) {}

  async obtenerParaUsuario(idUsuario: number): Promise<ColumnaResponseDto[]> {
    const columnas = await this.columnasRepository.obtenerParaUsuario(idUsuario);
    return columnas.map((c) =>
      plainToInstance(
        ColumnaResponseDto,
        { ...c, es_global: c.id_usuario === null },
        { excludeExtraneousValues: true },
      ),
    );
  }

  async crearColumna(idUsuario: number, datosColumna: CrearColumnaDto): Promise<ColumnaResponseDto> {
    const global = await this.columnasRepository.obtenerGlobalPorNombre(datosColumna.nombre);
    if (global) {
      throw new BadRequestError(
        'COLUMNA_NOMBRE_RESERVADO',
        `"${datosColumna.nombre}" es el nombre de una columna global y no puede usarse`,
      );
    }

    const existente = await this.columnasRepository.obtenerUsuarioPorNombre(idUsuario, datosColumna.nombre);
    if (existente) {
      throw new BadRequestError(
        'COLUMNA_DUPLICADA',
        `Ya existe una columna con el nombre "${datosColumna.nombre}"`,
      );
    }

    const maxOrden = await this.columnasRepository.maxOrdenUsuario(idUsuario);
    const orden = Math.max(maxOrden, 3) + 1;

    const columna = await this.columnasRepository.crearColumna(idUsuario, datosColumna.nombre, orden);
    return plainToInstance(
      ColumnaResponseDto,
      { ...columna, es_global: false },
      { excludeExtraneousValues: true },
    );
  }

  async eliminarColumna(idColumna: number, idUsuario: number): Promise<void> {
    const resultado = await this.columnasRepository.eliminarColumna(idColumna, idUsuario);
    if (resultado.count === 0) {
      throw new ForbiddenError(
        'COLUMNA_NO_AUTORIZADA',
        'No tenés permiso para eliminar esta columna o no existe',
      );
    }
  }
}

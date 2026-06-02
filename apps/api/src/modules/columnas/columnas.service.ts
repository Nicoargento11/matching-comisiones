import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { BadRequestError, ForbiddenError } from '../../common/errors/business-error';
import { ColumnasRepository } from './repositories/columnas.repository';
import { CreateColumnaDto } from './dto/create-columna.dto';
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

  async crear(idUsuario: number, dto: CreateColumnaDto): Promise<ColumnaResponseDto> {
    const existente = await this.columnasRepository.obtenerUsuarioPorNombre(
      idUsuario,
      dto.nombre,
    );
    if (existente) {
      throw new BadRequestError(
        'COLUMNA_DUPLICADA',
        `Ya existe una columna con el nombre "${dto.nombre}"`,
      );
    }

    const maxOrden = await this.columnasRepository.maxOrdenUsuario(idUsuario);
    const orden = Math.max(maxOrden, 3) + 1;

    const columna = await this.columnasRepository.crear(idUsuario, dto.nombre, orden);
    return plainToInstance(
      ColumnaResponseDto,
      { ...columna, es_global: false },
      { excludeExtraneousValues: true },
    );
  }

  async eliminar(idColumna: number, idUsuario: number): Promise<void> {
    const result = await this.columnasRepository.eliminar(idColumna, idUsuario);
    if (result.count === 0) {
      throw new ForbiddenError(
        'COLUMNA_NO_AUTORIZADA',
        'No tenés permiso para eliminar esta columna o no existe',
      );
    }
  }
}

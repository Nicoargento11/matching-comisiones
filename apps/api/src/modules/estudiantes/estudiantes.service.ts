import { Injectable } from '@nestjs/common';
import { EstudiantesRepository } from './repositories/estudiantes.repository';
import { verificarOExcepcion } from '../../common/helpers/verificar-existencia';

@Injectable()
export class EstudiantesService {
  constructor(private readonly estudiantesRepository: EstudiantesRepository) {}

  async obtenerComisiones(idUsuario: number) {
    await verificarOExcepcion(
      () => this.estudiantesRepository.verificarExistencia(idUsuario),
      'estudiante',
      idUsuario,
    );
    return this.estudiantesRepository.obtenerComisiones(idUsuario);
  }
}

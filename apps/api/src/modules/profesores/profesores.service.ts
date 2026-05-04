import { Injectable } from '@nestjs/common';
import { NotFoundError } from '../../common/errors/business-error';
import { ProfesoresRepository } from './repositories/profesores.repository';
import { verificarOExcepcion } from '../../common/helpers/verificar-existencia';

@Injectable()
export class ProfesoresService {
  constructor(private readonly profesoresRepository: ProfesoresRepository) {}

  /**
   * Obtiene todas las comisiones asignadas a un profesor
   * @param idUsuario - ID del usuario (profesor)
   * @returns Lista de comisiones con datos completos
   * @throws NotFoundException si no existe el usuario
   */
  async obtenerComisiones(idUsuario: number) {
    await verificarOExcepcion(
      () => this.profesoresRepository.verificarExistencia(idUsuario),
      'usuario',
      idUsuario,
    );
    return this.profesoresRepository.obtenerComisiones(idUsuario);
  }

  /**
   * Obtiene la primera comisión asignada a un profesor
   * @param idUsuario - ID del usuario (profesor)
   * @returns Datos de la comisión
   * @throws NotFoundException si no existe el usuario o no tiene comisión
   */
  async obtenerComision(idUsuario: number) {
    await verificarOExcepcion(
      () => this.profesoresRepository.verificarExistencia(idUsuario),
      'usuario',
      idUsuario,
    );
    const comision =
      await this.profesoresRepository.obtenerPrimeraComision(idUsuario);
    if (!comision) {
      throw new NotFoundError(
        'PROFESOR_SIN_COMISION',
        'El profesor no tiene comisión asignada',
      );
    }
    return comision;
  }
}

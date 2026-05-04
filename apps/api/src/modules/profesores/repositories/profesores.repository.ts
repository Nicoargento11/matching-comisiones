import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { COMISION_SELECT } from '../../comisiones/repositories/comisiones.repository';

@Injectable()
export class ProfesoresRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Verifica si existe un usuario por su ID
   * @param idUsuario - ID del usuario a verificar
   * @returns El usuario encontrado, o null si no existe
   */
  async verificarExistencia(idUsuario: number) {
    return this.prisma.usuario.findUnique({
      where: { id_usuario: idUsuario },
      select: {
        id_usuario: true,
        nombre_usuario: true,
        apellido_usuario: true,
        correo: true,
        activo: true,
      },
    });
  }

  /**
   * Obtiene todas las comisiones asignadas a un profesor
   * @param idUsuario - ID del usuario (profesor)
   * @returns Lista de comisiones con datos completos
   */
  async obtenerComisiones(idUsuario: number) {
    return this.prisma.comision.findMany({
      where: { id_usuario_profesor: idUsuario },
      select: COMISION_SELECT,
    });
  }

  /**
   * Obtiene la primera comisión asignada a un profesor
   * @param idUsuario - ID del usuario (profesor)
   * @returns La primera comisión encontrada, o null si no tiene
   */
  async obtenerPrimeraComision(idUsuario: number) {
    return this.prisma.comision.findFirst({
      where: { id_usuario_profesor: idUsuario },
      select: COMISION_SELECT,
    });
  }
}

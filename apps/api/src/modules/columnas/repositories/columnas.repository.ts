import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class ColumnasRepository {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerParaUsuario(idUsuario: number) {
    return this.prisma.columnaTablero.findMany({
      where: {
        OR: [{ id_usuario: null }, { id_usuario: idUsuario }],
      },
      orderBy: { orden_columna: 'asc' },
      select: { id_columna: true, nombre: true, orden_columna: true, id_usuario: true },
    });
  }

  async maxOrdenUsuario(idUsuario: number): Promise<number> {
    const result = await this.prisma.columnaTablero.aggregate({
      where: { id_usuario: idUsuario },
      _max: { orden_columna: true },
    });
    return result._max.orden_columna ?? 3;
  }

  async crear(idUsuario: number, nombre: string, orden: number) {
    return this.prisma.columnaTablero.create({
      data: { nombre, orden_columna: orden, id_usuario: idUsuario },
      select: { id_columna: true, nombre: true, orden_columna: true, id_usuario: true },
    });
  }

  async obtenerGlobalPorNombre(nombre: string) {
    return this.prisma.columnaTablero.findFirst({
      where: { nombre, id_usuario: null },
      select: { id_columna: true },
    });
  }

  async obtenerUsuarioPorNombre(idUsuario: number, nombre: string) {
    return this.prisma.columnaTablero.findFirst({
      where: { nombre, id_usuario: idUsuario },
      select: { id_columna: true },
    });
  }

  async eliminar(idColumna: number, idUsuario: number): Promise<{ count: number }> {
    return this.prisma.columnaTablero.deleteMany({
      where: { id_columna: idColumna, id_usuario: idUsuario },
    });
  }
}

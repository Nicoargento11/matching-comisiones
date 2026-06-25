import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

export abstract class ColumnasRepository {
  abstract obtenerParaUsuario(idUsuario: number): ReturnType<PrismaColumnasRepository['obtenerParaUsuario']>;
  abstract maxOrdenUsuario(idUsuario: number): Promise<number>;
  abstract crearColumna(idUsuario: number, nombre: string, orden: number): ReturnType<PrismaColumnasRepository['crearColumna']>;
  abstract obtenerGlobalPorNombre(nombre: string): ReturnType<PrismaColumnasRepository['obtenerGlobalPorNombre']>;
  abstract obtenerUsuarioPorNombre(idUsuario: number, nombre: string): ReturnType<PrismaColumnasRepository['obtenerUsuarioPorNombre']>;
  abstract eliminarColumna(idColumna: number, idUsuario: number): Promise<{ count: number }>;
}

@Injectable()
export class PrismaColumnasRepository extends ColumnasRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

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
    const resultado = await this.prisma.columnaTablero.aggregate({
      where: { id_usuario: idUsuario },
      _max: { orden_columna: true },
    });
    return resultado._max.orden_columna ?? 3;
  }

  async crearColumna(idUsuario: number, nombre: string, orden: number) {
    return this.prisma.columnaTablero.create({
      data: { nombre, orden_columna: orden, id_usuario: idUsuario },
      select: { id_columna: true, nombre: true, orden_columna: true, id_usuario: true },
    });
  }

  async obtenerGlobalPorNombre(nombre: string) {
    return this.prisma.columnaTablero.findFirst({
      where: { nombre: { equals: nombre, mode: 'insensitive' }, id_usuario: null },
      select: { id_columna: true },
    });
  }

  async obtenerUsuarioPorNombre(idUsuario: number, nombre: string) {
    return this.prisma.columnaTablero.findFirst({
      where: { nombre: { equals: nombre, mode: 'insensitive' }, id_usuario: idUsuario },
      select: { id_columna: true },
    });
  }

  async eliminarColumna(idColumna: number, idUsuario: number): Promise<{ count: number }> {
    return this.prisma.columnaTablero.deleteMany({
      where: { id_columna: idColumna, id_usuario: idUsuario },
    });
  }
}

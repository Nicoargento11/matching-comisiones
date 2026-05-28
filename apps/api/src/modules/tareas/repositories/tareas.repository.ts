import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PrioridadTarea } from '@prisma/client';

const TAREA_SELECT = {
  id_tarea: true,
  titulo: true,
  descripcion: true,
  prioridad: true,
  columna: {
    select: { nombre: true },
  },
} as const;

@Injectable()
export class TareasRepository {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerPorUsuario(idUsuario: number) {
    return this.prisma.tarea.findMany({
      where: { id_usuario: idUsuario },
      orderBy: { id_tarea: 'desc' },
      select: TAREA_SELECT,
    });
  }

  async obtenerColumnaPorNombre(nombre: string) {
    return this.prisma.columnaTablero.findFirst({
      where: { nombre },
      select: { id_columna: true },
    });
  }

  async crear(
    idUsuario: number,
    data: {
      titulo: string;
      prioridad: PrioridadTarea;
      id_columna: number;
      descripcion?: string;
    },
  ) {
    return this.prisma.tarea.create({
      data: {
        titulo: data.titulo,
        prioridad: data.prioridad,
        id_columna: data.id_columna,
        id_usuario: idUsuario,
        descripcion: data.descripcion,
      },
      select: TAREA_SELECT,
    });
  }

  async actualizarEstado(idTarea: number, idUsuario: number, idColumna: number) {
    return this.prisma.tarea.updateMany({
      where: { id_tarea: idTarea, id_usuario: idUsuario },
      data: { id_columna: idColumna },
    });
  }

  async obtenerPorId(idTarea: number) {
    return this.prisma.tarea.findUnique({
      where: { id_tarea: idTarea },
      select: TAREA_SELECT,
    });
  }

  async eliminar(idTarea: number, idUsuario: number) {
    return this.prisma.tarea.deleteMany({
      where: { id_tarea: idTarea, id_usuario: idUsuario },
    });
  }
}

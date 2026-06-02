import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PrioridadTarea } from '@prisma/client';

const TAREA_SELECT = {
  id_tarea: true,
  titulo: true,
  descripcion: true,
  prioridad: true,
  estimacion_min: true,
  fecha_vencimiento: true,
  id_materia: true,
  id_evento: true,
  columna: {
    select: { nombre: true },
  },
  materia: {
    select: { id_materia: true, nombre_materia: true },
  },
  evento: {
    select: { id_evento: true, titulo: true, tipo_evento: true, fecha_inicio: true },
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

  async obtenerColumnaPorNombre(nombre: string, idUsuario?: number) {
    if (idUsuario) {
      const userCol = await this.prisma.columnaTablero.findFirst({
        where: { nombre, id_usuario: idUsuario },
        select: { id_columna: true },
      });
      if (userCol) return userCol;
    }
    return this.prisma.columnaTablero.findFirst({
      where: { nombre, id_usuario: null },
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
      estimacion_min?: number;
      id_materia?: number;
      id_evento?: number;
      fecha_vencimiento?: Date;
    },
  ) {
    return this.prisma.tarea.create({
      data: {
        titulo: data.titulo,
        prioridad: data.prioridad,
        id_columna: data.id_columna,
        id_usuario: idUsuario,
        descripcion: data.descripcion,
        estimacion_min: data.estimacion_min,
        id_materia: data.id_materia,
        id_evento: data.id_evento,
        fecha_vencimiento: data.fecha_vencimiento,
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

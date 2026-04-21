import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const comisionSelect = {
  id_comision: true,
  numero_comision: true,
  nombre_comision: true,
  cupo_maximo: true,
  materia: { select: { id_materia: true, nombre_materia: true } },
  profesor: {
    select: {
      id_usuario: true,
      nombre_usuario: true,
      apellido_usuario: true,
      correo: true,
    },
  },
  horarios: {
    select: {
      id_horario_comision: true,
      hora_inicio: true,
      hora_fin: true,
      formato: true,
      dia: { select: { numero_dia: true, nombre_dia: true } },
      modalidad: { select: { id_modalidad: true, nombre_modalidad: true } },
      aula: { select: { id_aula: true, nombre: true } },
    },
  },
  usuarios: {
    select: {
      estado: true,
      usuario: {
        select: {
          id_usuario: true,
          nombre_usuario: true,
          apellido_usuario: true,
          correo: true,
        },
      },
    },
  },
  eventos: {
    select: {
      id_evento: true,
      titulo: true,
      descripcion: true,
      tipo_evento: true,
      fecha_inicio: true,
      fecha_fin: true,
      origen: true,
      id_materia: true,
      id_comision: true,
    },
    orderBy: { fecha_inicio: 'asc' as const },
  },
};

@Injectable()
export class ProfesoresService {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerComisiones(idUsuario: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id_usuario: idUsuario },
    });
    if (!usuario) {
      throw new NotFoundException(
        `No existe usuario con id_usuario=${idUsuario}`,
      );
    }
    return this.prisma.comision.findMany({
      where: { id_usuario_profesor: idUsuario },
      select: comisionSelect,
    });
  }

  async obtenerComision(idUsuario: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id_usuario: idUsuario },
    });
    if (!usuario) {
      throw new NotFoundException(
        `No existe usuario con id_usuario=${idUsuario}`,
      );
    }
    const comision = await this.prisma.comision.findFirst({
      where: { id_usuario_profesor: idUsuario },
      select: comisionSelect,
    });
    if (!comision) {
      throw new NotFoundException(`El profesor no tiene comisión asignada`);
    }
    return comision;
  }
}

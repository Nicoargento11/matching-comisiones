import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

export abstract class EstudiantesRepository {
  abstract verificarExistencia(idUsuario: number): ReturnType<PrismaEstudiantesRepository['verificarExistencia']>;
  abstract obtenerComisiones(idUsuario: number): ReturnType<PrismaEstudiantesRepository['obtenerComisiones']>;
}

@Injectable()
export class PrismaEstudiantesRepository extends EstudiantesRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async verificarExistencia(idUsuario: number) {
    return this.prisma.usuario.findUnique({
      where: { id_usuario: idUsuario },
      select: { id_usuario: true },
    });
  }

  async obtenerComisiones(idUsuario: number) {
    return this.prisma.usuarioComision.findMany({
      where: { id_usuario: idUsuario },
      select: {
        estado: true,
        comision: {
          select: {
            id_comision: true,
            numero_comision: true,
            nombre_comision: true,
            cupo_maximo: true,
            materia: {
              select: { id_materia: true, nombre_materia: true },
            },
            profesor: {
              select: {
                id_usuario: true,
                nombre_usuario: true,
                apellido_usuario: true,
                correo: true,
              },
            },
            horarios: {
              where: { activo: true },
              select: {
                id_horario_comision: true,
                hora_inicio: true,
                hora_fin: true,
                formato: true,
                dia: { select: { numero_dia: true, nombre_dia: true } },
                modalidad: {
                  select: { id_modalidad: true, nombre_modalidad: true },
                },
                aula: { select: { id_aula: true, nombre: true } },
              },
            },
            eventos: {
              where: { activo: true },
              select: {
                id_evento: true,
                titulo: true,
                tipo_evento: true,
                fecha_inicio: true,
                fecha_fin: true,
                origen: true,
                id_materia: true,
                id_comision: true,
              },
              orderBy: { fecha_inicio: 'asc' as const },
            },
          },
        },
      },
    });
  }
}

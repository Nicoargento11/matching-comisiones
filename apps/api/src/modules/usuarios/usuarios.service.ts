import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}
  async ObtenerEstudiante(idUsuario: number) {
    const estudiante = await this.prisma.usuario.findUnique({
      where: { id_usuario: idUsuario },
      select: {
        id_usuario: true,
        dni: true,
        nombre_usuario: true,
        apellido_usuario: true,
        correo: true,
        activo: true,
        fecha_registro: true,
      },
    });
    if (!estudiante) {
      throw new NotFoundException(
        `No existe estudiante con id_usuario=${idUsuario}`,
      );
    }
    return estudiante;
  }

  async ObtenerComisionesDeEstudiante(idUsuario: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id_usuario: idUsuario },
      select: { id_usuario: true },
    });
    if (!usuario) {
      throw new NotFoundException(
        `No existe estudiante con id_usuario=${idUsuario}`,
      );
    }
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
              select: {
                id_materia: true,
                nombre_materia: true,
              },
            },
            profesor: {
              select: {
                id_profesor: true,
                nombre_profesor: true,
              },
            },
          },
        },
      },
    });
  }

  async ObtenerConversaciones(idUsuario: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id_usuario: idUsuario },
      select: { id_usuario: true },
    });
    if (!usuario) {
      throw new NotFoundException(
        `No existe usuario con id_usuario=${idUsuario}`,
      );
    }
    return this.prisma.conversacionParticipante.findMany({
      where: { id_usuario: idUsuario },
      select: {
        ultimo_leido: true,
        conversacion: {
          select: {
            id_conversacion: true,
            creada_en: true,
            participantes: {
              select: {
                usuario: {
                  select: {
                    id_usuario: true,
                    nombre_usuario: true,
                    apellido_usuario: true,
                  },
                },
              },
            },
            mensajes: {
              orderBy: { creado_en: 'desc' },
              take: 1,
              select: { contenido: true, creado_en: true },
            },
          },
        },
      },
    });
  }
}

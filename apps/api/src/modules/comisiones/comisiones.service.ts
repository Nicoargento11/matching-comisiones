import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AddEstudianteDto } from './dto/add-estudiante.dto';
import { CreateHorarioDto } from './dto/create-horario.dto';
import { CreateEventoDto } from './dto/create-evento.dto';

const comisionSelect = {
  id_comision: true,
  numero_comision: true,
  nombre_comision: true,
  cupo_maximo: true,
  materia: { select: { id_materia: true, nombre_materia: true } },
  profesor: { select: { id_profesor: true, nombre_profesor: true } },
  horarios: {
    select: {
      id_horario_comision: true,
      hora_inicio: true,
      hora_fin: true,
      dia: { select: { numero_dia: true, nombre_dia: true } },
      modalidad: { select: { id_modalidad: true, nombre_modalidad: true } },
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
    },
    orderBy: { fecha_inicio: 'asc' as const },
  },
};

@Injectable()
export class ComisionesService {
  constructor(private readonly prisma: PrismaService) {}

  private async verificarComision(idComision: number) {
    const comision = await this.prisma.comision.findUnique({
      where: { id_comision: idComision },
    });
    if (!comision) {
      throw new NotFoundException(`No existe comisión con id=${idComision}`);
    }
    return comision;
  }

  async ObtenerDetalleComision(idComision: number) {
    const comision = await this.prisma.comision.findUnique({
      where: { id_comision: idComision },
      select: comisionSelect,
    });
    if (!comision) {
      throw new NotFoundException(`No existe comisión con id=${idComision}`);
    }
    return comision;
  }

  async ObtenerComisionesDeUsuario(idUsuario: number) {
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
          select: comisionSelect,
        },
      },
    });
  }

  async agregarEstudiante(idComision: number, dto: AddEstudianteDto) {
    await this.verificarComision(idComision);
    const existing = await this.prisma.usuarioComision.findUnique({
      where: {
        id_usuario_id_comision: {
          id_usuario: dto.id_usuario,
          id_comision: idComision,
        },
      },
    });
    if (existing) {
      throw new ConflictException('El estudiante ya está en la comisión');
    }
    return this.prisma.usuarioComision.create({
      data: { id_usuario: dto.id_usuario, id_comision: idComision },
    });
  }

  async darBajaEstudiante(idComision: number, idUsuario: number) {
    await this.verificarComision(idComision);
    const inscripcion = await this.prisma.usuarioComision.findUnique({
      where: {
        id_usuario_id_comision: {
          id_usuario: idUsuario,
          id_comision: idComision,
        },
      },
    });
    if (!inscripcion) {
      throw new NotFoundException('El estudiante no está en esta comisión');
    }
    await this.prisma.usuarioComision.delete({
      where: {
        id_usuario_id_comision: {
          id_usuario: idUsuario,
          id_comision: idComision,
        },
      },
    });
  }

  async agregarHorario(idComision: number, dto: CreateHorarioDto) {
    await this.verificarComision(idComision);
    return this.prisma.horarioComision.create({
      data: { ...dto, id_comision: idComision },
    });
  }

  async eliminarHorario(idComision: number, idHorario: number) {
    const horario = await this.prisma.horarioComision.findFirst({
      where: { id_horario_comision: idHorario, id_comision: idComision },
    });
    if (!horario) {
      throw new NotFoundException('Horario no encontrado en esta comisión');
    }
    await this.prisma.horarioComision.delete({
      where: { id_horario_comision: idHorario },
    });
  }

  async agregarEvento(idComision: number, dto: CreateEventoDto) {
    await this.verificarComision(idComision);
    return this.prisma.evento.create({
      data: {
        ...dto,
        id_comision: idComision,
        fecha_inicio: new Date(dto.fecha_inicio),
        fecha_fin: new Date(dto.fecha_fin),
      },
    });
  }

  async eliminarEvento(idComision: number, idEvento: number) {
    const evento = await this.prisma.evento.findFirst({
      where: { id_evento: idEvento, id_comision: idComision },
    });
    if (!evento) {
      throw new NotFoundException('Evento no encontrado en esta comisión');
    }
    await this.prisma.evento.delete({ where: { id_evento: idEvento } });
  }
}

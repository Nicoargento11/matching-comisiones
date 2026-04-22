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
    if (existing && existing.estado === 'ACTIVO') {
      throw new ConflictException('El estudiante ya está activo en la comisión');
    }
    if (existing) {
      return this.prisma.usuarioComision.update({
        where: {
          id_usuario_id_comision: {
            id_usuario: dto.id_usuario,
            id_comision: idComision,
          },
        },
        data: { estado: 'ACTIVO' },
      });
    }
    return this.prisma.usuarioComision.create({
      data: { id_usuario: dto.id_usuario, id_comision: idComision, estado: 'ACTIVO' },
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
    await this.prisma.usuarioComision.update({
      where: {
        id_usuario_id_comision: {
          id_usuario: idUsuario,
          id_comision: idComision,
        },
      },
      data: { estado: 'BAJA' },
    });
  }

  async agregarHorario(idComision: number, dto: CreateHorarioDto) {
    await this.verificarComision(idComision);

    const dia = await this.prisma.dia.findFirst({
      where: { nombre_dia: { equals: dto.nombre_dia, mode: 'insensitive' } },
    });
    if (!dia) {
      throw new NotFoundException(`No existe el día "${dto.nombre_dia}"`);
    }

    const modalidad = await this.prisma.modalidad.findFirst({
      where: {
        nombre_modalidad: { equals: dto.nombre_modalidad, mode: 'insensitive' },
      },
    });
    if (!modalidad) {
      throw new NotFoundException(
        `No existe la modalidad "${dto.nombre_modalidad}"`,
      );
    }

    let id_aula: number | undefined
    if (dto.nombre_aula?.trim()) {
      const aula = await this.prisma.aula.upsert({
        where: { nombre: dto.nombre_aula.trim() },
        update: {},
        create: { nombre: dto.nombre_aula.trim() },
      })
      id_aula = aula.id_aula
    }

    return this.prisma.horarioComision.create({
      data: {
        hora_inicio: dto.hora_inicio,
        hora_fin: dto.hora_fin,
        numero_dia: dia.numero_dia,
        id_modalidad: modalidad.id_modalidad,
        formato: dto.formato ?? 'TEORICO_PRACTICO',
        id_comision: idComision,
        ...(id_aula !== undefined && { id_aula }),
      },
      select: {
        id_horario_comision: true,
        hora_inicio: true,
        hora_fin: true,
        formato: true,
        dia: { select: { numero_dia: true, nombre_dia: true } },
        modalidad: { select: { id_modalidad: true, nombre_modalidad: true } },
        aula: { select: { id_aula: true, nombre: true } },
      },
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

  async modificarEvento(idComision: number, idEvento: number, dto: any) {
    const evento = await this.prisma.evento.findFirst({
      where: { id_evento: idEvento, id_comision: idComision },
    });
    if (!evento) {
      throw new NotFoundException('Evento no encontrado en esta comisión');
    }
    
    return this.prisma.evento.update({
      where: { id_evento: idEvento },
      data: {
        ...dto,
        ...(dto.fecha_inicio && { fecha_inicio: new Date(dto.fecha_inicio) }),
        ...(dto.fecha_fin && { fecha_fin: new Date(dto.fecha_fin) }),
      },
    });
  }

  async modificarEvento(idComision: number, idEvento: number, dto: any) {
    const evento = await this.prisma.evento.findFirst({
      where: { id_evento: idEvento, id_comision: idComision },
    });
    if (!evento) {
      throw new NotFoundException('Evento no encontrado en esta comisión');
    }
    
    return this.prisma.evento.update({
      where: { id_evento: idEvento },
      data: {
        ...dto,
        ...(dto.fecha_inicio && { fecha_inicio: new Date(dto.fecha_inicio) }),
        ...(dto.fecha_fin && { fecha_fin: new Date(dto.fecha_fin) }),
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

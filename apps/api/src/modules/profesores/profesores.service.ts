import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const comisionSelect = {
  id_comision: true,
  numero_comision: true,
  nombre_comision: true,
  cupo_maximo: true,
  materia: { select: { id_materia: true, nombre_materia: true } },
  horarios: {
    select: {
      id_horario_comision: true,
      hora_inicio: true,
      hora_fin: true,
      dia: { select: { numero_dia: true, nombre_dia: true } },
      modalidad: { select: { id_modalidad: true, nombre_modalidad: true } },
    },
  },
};

@Injectable()
export class ProfesoresService {
  constructor(private readonly prisma: PrismaService) {}

  private async verificarProfesor(idProfesor: number) {
    const profesor = await this.prisma.profesor.findUnique({
      where: { id_profesor: idProfesor },
    });
    if (!profesor) {
      throw new NotFoundException(`No existe profesor con id=${idProfesor}`);
    }
    return profesor;
  }

  async obtenerComisiones(idProfesor: number) {
    await this.verificarProfesor(idProfesor);
    return this.prisma.comision.findMany({
      where: { id_profesor: idProfesor },
      select: comisionSelect,
    });
  }

  async obtenerComision(idProfesor: number) {
    await this.verificarProfesor(idProfesor);
    const comision = await this.prisma.comision.findFirst({
      where: { id_profesor: idProfesor },
      select: comisionSelect,
    });
    if (!comision) {
      throw new NotFoundException(`El profesor no tiene comisión asignada`);
    }
    return comision;
  }
}

import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMensajeDto } from './dto/create-mensaje.dto';
import { CreateConversacionDto } from './dto/create-conversacion.dto';
import { MarcarLeidoDto } from './dto/marcar-leido.dto';

@Injectable()
export class MensajesService {
  constructor(private readonly prisma: PrismaService) {}

  async crearConversacion(dto: CreateConversacionDto) {
    const existente = await this.prisma.conversacion.findFirst({
      where: {
        AND: [
          { participantes: { some: { id_usuario: dto.id_usuario_1 } } },
          { participantes: { some: { id_usuario: dto.id_usuario_2 } } },
        ],
      },
      select: { id_conversacion: true },
    });
    if (existente) {
      throw new ConflictException('Ya existe una conversación entre estos usuarios');
    }
    return this.prisma.conversacion.create({
      data: {
        participantes: {
          create: [
            { id_usuario: dto.id_usuario_1 },
            { id_usuario: dto.id_usuario_2 },
          ],
        },
      },
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
      },
    });
  }

  async obtenerConversacion(idConversacion: number) {
    const conversacion = await this.prisma.conversacion.findUnique({
      where: { id_conversacion: idConversacion },
      select: {
        id_conversacion: true,
        creada_en: true,
        participantes: {
          select: {
            ultimo_leido: true,
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
          orderBy: { creado_en: 'asc' },
          select: {
            id_mensaje: true,
            contenido: true,
            creado_en: true,
            emisor: {
              select: {
                id_usuario: true,
                nombre_usuario: true,
                apellido_usuario: true,
              },
            },
          },
        },
      },
    });
    if (!conversacion) {
      throw new NotFoundException(`No existe conversación con id=${idConversacion}`);
    }
    return conversacion;
  }

  async marcarLeido(idConversacion: number, dto: MarcarLeidoDto) {
    const participante = await this.prisma.conversacionParticipante.findUnique({
      where: {
        id_conversacion_id_usuario: {
          id_conversacion: idConversacion,
          id_usuario: dto.id_usuario,
        },
      },
    });
    if (!participante) {
      throw new NotFoundException('El usuario no pertenece a esta conversación');
    }
    return this.prisma.conversacionParticipante.update({
      where: {
        id_conversacion_id_usuario: {
          id_conversacion: idConversacion,
          id_usuario: dto.id_usuario,
        },
      },
      data: { ultimo_leido: new Date() },
      select: { id_conversacion: true, id_usuario: true, ultimo_leido: true },
    });
  }

  async obtenerMensajes(idConversacion: number) {
    const conversacion = await this.prisma.conversacion.findUnique({
      where: { id_conversacion: idConversacion },
    });
    if (!conversacion) {
      throw new NotFoundException(`No existe conversación con id=${idConversacion}`);
    }
    return this.prisma.mensaje.findMany({
      where: { id_conversacion: idConversacion },
      orderBy: { creado_en: 'asc' },
      select: {
        id_mensaje: true,
        contenido: true,
        creado_en: true,
        emisor: {
          select: {
            id_usuario: true,
            nombre_usuario: true,
            apellido_usuario: true,
          },
        },
      },
    });
  }

  async enviarMensaje(dto: CreateMensajeDto) {
    const conversacion = await this.prisma.conversacion.findUnique({
      where: { id_conversacion: dto.id_conversacion },
    });
    if (!conversacion) {
      throw new NotFoundException(`No existe conversación con id=${dto.id_conversacion}`);
    }
    return this.prisma.mensaje.create({
      data: {
        contenido: dto.contenido,
        id_conversacion: dto.id_conversacion,
        id_usuario_emisor: dto.id_usuario_emisor,
      },
      select: {
        id_mensaje: true,
        contenido: true,
        creado_en: true,
        id_conversacion: true,
        id_usuario_emisor: true,
      },
    });
  }
}

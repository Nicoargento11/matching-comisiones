import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMensajeDto } from './dto/create-mensaje.dto';

@Injectable()
export class MensajesService {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerMensajes(idConversacion: number) {
    const conversacion = await this.prisma.conversacion.findUnique({
      where: { id_conversacion: idConversacion },
    });
    if (!conversacion) {
      throw new NotFoundException(
        `No existe conversación con id=${idConversacion}`,
      );
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
      throw new NotFoundException(
        `No existe conversación con id=${dto.id_conversacion}`,
      );
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

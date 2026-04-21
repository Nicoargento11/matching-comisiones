import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(supabaseAuthId: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { supabase_auth_id: supabaseAuthId },
      select: {
        id_usuario: true,
        nombre_usuario: true,
        apellido_usuario: true,
        correo: true,
        activo: true,
        roles: { select: { rol: { select: { id_rol: true, nombre_rol: true } } } },
      },
    });

    if (!usuario) {
      throw new NotFoundException(
        'Usuario no encontrado. ¿Está vinculado el supabase_auth_id?',
      );
    }

    return {
      ...usuario,
      roles: usuario.roles.map((r) => r.rol),
    };
  }
}

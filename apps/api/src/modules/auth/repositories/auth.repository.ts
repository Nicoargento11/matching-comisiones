import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

/** Select para consulta de usuario autenticado (sin contrasena) */
const AUTH_USUARIO_SELECT = {
  id_usuario: true,
  nombre_usuario: true,
  apellido_usuario: true,
  correo: true,
  activo: true,
  roles: {
    select: { rol: { select: { id_rol: true, nombre_rol: true } } },
  },
} as const;

export abstract class AuthRepository {
  abstract obtenerPorAuthId(supabaseAuthId: string): ReturnType<PrismaAuthRepository['obtenerPorAuthId']>;
}

@Injectable()
export class PrismaAuthRepository extends AuthRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  /**
   * Obtiene los datos de un usuario por su supabase_auth_id
   * @param supabaseAuthId - ID de autenticación de Supabase
   * @returns Datos del usuario sin contrasena, o null si no existe
   */
  async obtenerPorAuthId(supabaseAuthId: string) {
    return this.prisma.usuario.findUnique({
      where: { supabase_auth_id: supabaseAuthId },
      select: AUTH_USUARIO_SELECT,
    });
  }
}

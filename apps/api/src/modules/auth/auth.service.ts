import { Injectable } from '@nestjs/common';
import { AuthRepository } from './repositories/auth.repository';
import { NotFoundError } from '../../common/errors/business-error';

@Injectable()
export class AuthService {
  constructor(private readonly authRepository: AuthRepository) {}

  /**
   * Obtiene los datos del usuario autenticado a partir de su supabase_auth_id
   * @param supabaseAuthId - ID de autenticación de Supabase del token JWT
   * @returns Datos del usuario con roles aplanados
   * @throws NotFoundException si el usuario no está vinculado a un supabase_auth_id
   */
  async obtenerMe(supabaseAuthId: string) {
    const usuario = await this.authRepository.obtenerPorAuthId(supabaseAuthId);

    if (!usuario) {
      throw new NotFoundError(
        'AUTH_USUARIO_NO_VINCULADO',
        'Usuario no encontrado. ¿Está vinculado el supabase_auth_id?',
      );
    }

    return {
      ...usuario,
      roles: usuario.roles.map((r) => r.rol),
    };
  }
}

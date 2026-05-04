import { Expose, Exclude, Type } from 'class-transformer';

/** DTO de respuesta para datos del usuario autenticado (auth/me) */
@Exclude()
export class AuthMeResponseDto {
  @Expose()
  id_usuario: number;

  @Expose()
  nombre_usuario: string;

  @Expose()
  apellido_usuario: string;

  @Expose()
  correo: string;

  @Expose()
  activo: boolean;

  @Expose()
  @Type(() => AuthRolResponseDto)
  roles: AuthRolResponseDto[];
}

/** DTO de rol dentro de la respuesta de auth/me */
@Exclude()
export class AuthRolResponseDto {
  @Expose()
  id_rol: number;

  @Expose()
  nombre_rol: string;
}

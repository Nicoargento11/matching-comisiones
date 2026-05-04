import { Expose, Exclude, Type } from 'class-transformer';

/** DTO de respuesta para datos de usuario (nunca expone contrasena) */
@Exclude()
export class UsuarioResponseDto {
  @Expose()
  id_usuario: number;

  @Expose()
  dni: number;

  @Expose()
  nombre_usuario: string;

  @Expose()
  apellido_usuario: string;

  @Expose()
  correo: string;

  @Exclude()
  contrasena: string;

  @Expose()
  activo: boolean;

  @Expose()
  fecha_registro: Date;

  @Expose()
  @Type(() => RolResponseDto)
  roles: RolResponseDto[];
}

/** DTO de respuesta para datos de rol */
@Exclude()
export class RolResponseDto {
  @Expose()
  id_rol: number;

  @Expose()
  nombre_rol: string;
}

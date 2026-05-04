import { Expose, Exclude } from 'class-transformer';

/** DTO de respuesta para datos de profesor con sus comisiones */
@Exclude()
export class ProfesorResponseDto {
  @Expose()
  id_usuario: number;

  @Expose()
  nombre_usuario: string;

  @Expose()
  apellido_usuario: string;

  @Expose()
  correo: string;
}

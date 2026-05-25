import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class NotificacionResponseDto {
  @Expose()
  id_notificacion: number;

  @Expose()
  tipo: string;

  @Expose()
  titulo: string;

  @Expose()
  mensaje: string;

  @Expose()
  leida: boolean;

  @Expose()
  creada_en: string;

  @Expose()
  datos: object | null;
}

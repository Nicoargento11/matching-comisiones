import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class TareaTableroResponseDto {
  @Expose()
  id_tarea: string;

  @Expose()
  titulo: string;

  @Expose()
  descripcion: string | null;

  @Expose()
  prioridad: string;

  @Expose()
  estado: string;
}

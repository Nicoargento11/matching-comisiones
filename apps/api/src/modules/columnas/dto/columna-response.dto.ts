import { Expose } from 'class-transformer';

export class ColumnaResponseDto {
  @Expose() id_columna: number;
  @Expose() nombre: string;
  @Expose() orden_columna: number;
  @Expose() es_global: boolean;
}

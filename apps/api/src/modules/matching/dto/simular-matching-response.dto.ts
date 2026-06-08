import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

/**
 * Respuesta de `POST /matching/simular`: refleja el `Intercambio` real creado
 * y completado (ya no un stub con `intercambioId: Date.now()`), incluyendo la
 * URL del comprobante generado por el observer crítico (`ComprobanteObserver`).
 */
@Exclude()
export class SimularMatchingResponseDto {
  @ApiProperty({ example: 10, description: 'ID del intercambio creado y completado' })
  @Expose()
  id_intercambio: number;

  @ApiProperty({ example: 'COMPLETADO', description: 'Nombre del estado final del intercambio' })
  @Expose()
  estado: string;

  @ApiProperty({
    example: 'https://cdn.example.com/comprobantes/10.pdf',
    description: 'URL pública del comprobante generado para el intercambio',
  })
  @Expose()
  comprobante_url: string;

  @ApiProperty({ example: 'Matching simulado correctamente', description: 'Mensaje descriptivo del resultado' })
  @Expose()
  mensaje: string;
}

import { plainToInstance } from 'class-transformer';
import { IntercambioResponseDto } from './dto/intercambio-response.dto';

function prepararParaMapeo(raw: { fecha_solicitud: Date; [key: string]: unknown }) {
  return { ...raw, fecha_solicitud: raw.fecha_solicitud.toISOString() };
}

export function mapearIntercambioResponse(raw: unknown): IntercambioResponseDto {
  const prepared = prepararParaMapeo(raw as { fecha_solicitud: Date; [key: string]: unknown });
  return plainToInstance(IntercambioResponseDto, prepared, {
    excludeExtraneousValues: true,
  });
}

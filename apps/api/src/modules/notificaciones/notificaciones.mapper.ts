import { plainToInstance } from 'class-transformer';
import { NotificacionResponseDto } from './dto/notificacion-response.dto';

function prepararParaMapeo(raw: { creada_en: Date; [key: string]: unknown }) {
  return { ...raw, creada_en: raw.creada_en.toISOString() };
}

export function mapearNotificacionResponse(raw: unknown): NotificacionResponseDto {
  const prepared = prepararParaMapeo(raw as { creada_en: Date; [key: string]: unknown });
  return plainToInstance(NotificacionResponseDto, prepared, {
    excludeExtraneousValues: true,
  });
}

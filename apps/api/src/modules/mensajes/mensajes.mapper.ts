import { plainToInstance } from 'class-transformer';
import {
  ConversacionResponseDto,
  MensajeResponseDto,
} from './dto/mensaje-response.dto';

/**
 * Mapea una entidad Prisma de conversación al DTO de respuesta serializable.
 */
export function mapearConversacionResponse(
  conversacion: unknown,
): ConversacionResponseDto {
  return plainToInstance(ConversacionResponseDto, conversacion, {
    excludeExtraneousValues: true,
  });
}

/**
 * Mapea una entidad Prisma de mensaje al DTO de respuesta serializable.
 */
export function mapearMensajeResponse(mensaje: unknown): MensajeResponseDto {
  return plainToInstance(MensajeResponseDto, mensaje, {
    excludeExtraneousValues: true,
  });
}

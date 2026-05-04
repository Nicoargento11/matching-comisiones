import { plainToInstance } from 'class-transformer';
import { ComisionResponseDto } from './dto/comision-response.dto';

/**
 * Mapea una entidad Prisma de comisión al DTO de respuesta serializable.
 * Aplica @Expose/@Exclude definidos en ComisionResponseDto.
 */
export function mapearComisionResponse(comision: unknown): ComisionResponseDto {
  return plainToInstance(ComisionResponseDto, comision, {
    excludeExtraneousValues: true,
  });
}

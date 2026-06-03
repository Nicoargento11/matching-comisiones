import { IsString, MinLength, MaxLength, IsOptional, IsInt, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BuscarUsuariosDto {
  @ApiProperty({ description: 'Texto a buscar en nombre o apellido (mínimo 3 caracteres)', minLength: 3, maxLength: 100 })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  q: string;

  @ApiPropertyOptional({ description: 'Filtrar por comisión (solo usuarios con inscripción ACTIVO)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  id_comision?: number;
}

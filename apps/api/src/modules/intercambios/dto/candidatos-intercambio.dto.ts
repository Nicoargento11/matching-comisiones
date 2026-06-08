import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsPositive } from 'class-validator';

export class CandidatosIntercambioDto {
  @ApiProperty({ example: 1, description: 'ID de la comisión que ofrece el solicitante' })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  id_comision_origen: number;

  @ApiProperty({ example: 2, description: 'ID del usuario solicitante (se excluye de los resultados)' })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  id_usuario_solicitante: number;
}

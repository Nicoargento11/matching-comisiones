import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class CreateIntercambioDto {
  @ApiProperty({ example: 2, description: 'ID del usuario que ofrece su comisión' })
  @IsInt()
  @IsPositive()
  id_usuario_ofrece: number;

  @ApiProperty({ example: 1, description: 'ID de la comisión que ofrece' })
  @IsInt()
  @IsPositive()
  id_comision_ofrece: number;

  @ApiProperty({ example: 3, description: 'ID del usuario destino del intercambio' })
  @IsInt()
  @IsPositive()
  id_usuario_destino: number;

  @ApiProperty({ example: 2, description: 'ID de la comisión del usuario destino' })
  @IsInt()
  @IsPositive()
  id_comision_destino: number;
}

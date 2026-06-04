import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class SimularMatchingDto {
  @ApiProperty({ example: 1, description: 'ID del usuario solicitante' })
  @IsInt()
  @IsPositive()
  usuarioSolicitanteId: number;

  @ApiProperty({ example: 2, description: 'ID del usuario receptor' })
  @IsInt()
  @IsPositive()
  usuarioReceptorId: number;

  @ApiProperty({ example: 10, description: 'ID de la comisión origen' })
  @IsInt()
  @IsPositive()
  comisionOrigenId: number;

  @ApiProperty({ example: 20, description: 'ID de la comisión destino' })
  @IsInt()
  @IsPositive()
  comisionDestinoId: number;
}

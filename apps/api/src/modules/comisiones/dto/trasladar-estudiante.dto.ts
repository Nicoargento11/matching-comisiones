import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class TrasladarEstudianteDto {
  @ApiProperty({ example: 1, description: 'ID del usuario a trasladar' })
  @IsInt()
  @IsPositive()
  id_usuario: number;
}

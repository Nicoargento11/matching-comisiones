import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class AgregarEstudianteDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive()
  id_usuario: number;
}

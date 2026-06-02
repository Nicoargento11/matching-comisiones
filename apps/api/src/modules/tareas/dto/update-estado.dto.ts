import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateEstadoDto {
  @ApiProperty({ example: 'EN_PROGRESO', description: 'Nombre de estado global o columna custom del usuario' })
  @IsString()
  @IsNotEmpty()
  estado: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class MarcarLeidoDto {
  @ApiProperty({
    example: 1,
    description: 'ID del usuario que leyó los mensajes',
  })
  @IsInt()
  @IsPositive()
  id_usuario: number;
}

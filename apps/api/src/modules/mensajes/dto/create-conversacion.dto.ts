import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class CreateConversacionDto {
  @ApiProperty({ example: 1, description: 'ID del primer usuario' })
  @IsInt()
  @IsPositive()
  id_usuario_1: number;

  @ApiProperty({ example: 2, description: 'ID del segundo usuario' })
  @IsInt()
  @IsPositive()
  id_usuario_2: number;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive, IsString, MinLength } from 'class-validator';

export class CreateMensajeDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive()
  id_conversacion: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive()
  id_usuario_emisor: number;

  @ApiProperty({ example: 'Hola, ¿cambiamos comisión?' })
  @IsString()
  @MinLength(1)
  contenido: string;
}

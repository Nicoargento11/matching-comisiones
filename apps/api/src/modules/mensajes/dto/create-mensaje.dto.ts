import { IsInt, IsPositive, IsString, MinLength } from 'class-validator';

export class CreateMensajeDto {
  @IsInt()
  @IsPositive()
  id_conversacion: number;

  @IsInt()
  @IsPositive()
  id_usuario_emisor: number;

  @IsString()
  @MinLength(1)
  contenido: string;
}

import { Exclude, Expose, Type } from 'class-transformer';

@Exclude()
class UsuarioSimpleDto {
  @Expose() id_usuario: number;
  @Expose() nombre_usuario: string;
  @Expose() apellido_usuario: string;
}

@Exclude()
class ComisionSimpleDto {
  @Expose() id_comision: number;
  @Expose() numero_comision: number | null;
  @Expose() nombre_comision: string | null;
}

@Exclude()
class UsuarioComisionDto {
  @Expose()
  @Type(() => UsuarioSimpleDto)
  usuario: UsuarioSimpleDto;

  @Expose()
  @Type(() => ComisionSimpleDto)
  comision: ComisionSimpleDto;
}

@Exclude()
class EstadoDto {
  @Expose() id_estado: number;
  @Expose() nombre_estado: string;
}

@Exclude()
export class IntercambioResponseDto {
  @Expose() id_intercambio: number;
  @Expose() fecha_solicitud: string;

  @Expose()
  @Type(() => EstadoDto)
  estado: EstadoDto;

  @Expose()
  @Type(() => UsuarioComisionDto)
  ofrece: UsuarioComisionDto;

  @Expose()
  @Type(() => UsuarioComisionDto)
  destino: UsuarioComisionDto;
}

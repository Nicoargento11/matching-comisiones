import { Expose, Exclude, Type } from 'class-transformer';

/** DTO simplificado de rol */
@Exclude()
export class RolSimpleResponseDto {
  @Expose()
  id_rol: number;

  @Expose()
  nombre_rol: string;
}

/** DTO simplificado de usuario dentro de conversación */
@Exclude()
export class UsuarioSimpleResponseDto {
  @Expose()
  id_usuario: number;

  @Expose()
  nombre_usuario: string;

  @Expose()
  apellido_usuario: string;

  @Expose()
  @Type(() => RolSimpleResponseDto)
  roles?: RolSimpleResponseDto[];
}

/** DTO de respuesta para participante de conversación */
@Exclude()
export class ParticipanteResponseDto {
  @Expose()
  ultimo_leido: Date;

  @Expose()
  @Type(() => UsuarioSimpleResponseDto)
  usuario: UsuarioSimpleResponseDto;
}

/** DTO simplificado de mensaje (para último mensaje en lista de conversaciones) */
@Exclude()
export class MensajeSimpleResponseDto {
  @Expose()
  contenido: string;

  @Expose()
  creado_en: Date;

  @Expose()
  id_usuario_emisor?: number;
}

/** DTO de respuesta para datos de conversación */
@Exclude()
export class ConversacionResponseDto {
  @Expose()
  id_conversacion: number;

  @Expose()
  creada_en: Date;

  @Expose()
  @Type(() => ParticipanteResponseDto)
  participantes: ParticipanteResponseDto[];

  @Expose()
  @Type(() => MensajeSimpleResponseDto)
  mensajes: MensajeSimpleResponseDto[];
}

/** DTO simplificado del emisor de un mensaje */
@Exclude()
export class EmisorResponseDto {
  @Expose()
  id_usuario: number;

  @Expose()
  nombre_usuario: string;

  @Expose()
  apellido_usuario: string;
}

/** DTO de respuesta para mensaje completo (con datos del emisor) */
@Exclude()
export class MensajeResponseDto {
  @Expose()
  id_mensaje: number;

  @Expose()
  contenido: string;

  @Expose()
  creado_en: Date;

  @Expose()
  @Type(() => EmisorResponseDto)
  emisor?: EmisorResponseDto;
}

/** DTO de respuesta para marcar leído */
@Exclude()
export class MarcarLeidoResponseDto {
  @Expose()
  id_conversacion: number;

  @Expose()
  id_usuario: number;

  @Expose()
  ultimo_leido: Date;
}

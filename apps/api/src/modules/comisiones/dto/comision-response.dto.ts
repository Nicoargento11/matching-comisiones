import { Expose, Exclude, Type } from 'class-transformer';

/** DTO simplificado de materia dentro de comisión */
@Exclude()
export class MateriaResponseDto {
  @Expose()
  id_materia: number;

  @Expose()
  nombre_materia: string;

  @Expose()
  color: string;
}

/** DTO simplificado de profesor dentro de comisión */
@Exclude()
export class ProfesorSimpleResponseDto {
  @Expose()
  id_usuario: number;

  @Expose()
  nombre_usuario: string;

  @Expose()
  apellido_usuario: string;

  @Expose()
  correo: string;
}

/** DTO de respuesta para día */
@Exclude()
export class DiaResponseDto {
  @Expose()
  numero_dia: number;

  @Expose()
  nombre_dia: string;
}

/** DTO de respuesta para modalidad */
@Exclude()
export class ModalidadResponseDto {
  @Expose()
  id_modalidad: number;

  @Expose()
  nombre_modalidad: string;
}

/** DTO de respuesta para aula */
@Exclude()
export class AulaResponseDto {
  @Expose()
  id_aula: number;

  @Expose()
  nombre: string;
}

/** DTO de respuesta para horario de comisión */
@Exclude()
export class HorarioResponseDto {
  @Expose()
  id_horario_comision: number;

  @Expose()
  hora_inicio: string;

  @Expose()
  hora_fin: string;

  @Expose()
  formato: string;

  @Expose()
  activo: boolean;

  @Expose()
  @Type(() => DiaResponseDto)
  dia: DiaResponseDto;

  @Expose()
  @Type(() => ModalidadResponseDto)
  modalidad: ModalidadResponseDto;

  @Expose()
  @Type(() => AulaResponseDto)
  aula: AulaResponseDto | null;
}

/** DTO simplificado de estudiante dentro de inscripción */
@Exclude()
export class EstudianteSimpleResponseDto {
  @Expose()
  id_usuario: number;

  @Expose()
  nombre_usuario: string;

  @Expose()
  apellido_usuario: string;

  @Expose()
  correo: string;
}

/** DTO de respuesta para inscripción de estudiante */
@Exclude()
export class InscripcionResponseDto {
  @Expose()
  estado: string;

  @Expose()
  @Type(() => EstudianteSimpleResponseDto)
  usuario: EstudianteSimpleResponseDto;
}

/** DTO de respuesta para evento de comisión */
@Exclude()
export class EventoResponseDto {
  @Expose()
  id_evento: number;

  @Expose()
  titulo: string;

  @Expose()
  descripcion: string;

  @Expose()
  tipo_evento: string;

  @Expose()
  fecha_inicio: Date;

  @Expose()
  fecha_fin: Date;

  @Expose()
  origen: string;

  @Expose()
  activo: boolean;

  @Expose()
  id_materia: number;

  @Expose()
  id_comision: number;
}

/** DTO de respuesta para datos de comisión con relaciones */
@Exclude()
export class ComisionResponseDto {
  @Expose()
  id_comision: number;

  @Expose()
  numero_comision: number;

  @Expose()
  nombre_comision: string;

  @Expose()
  cupo_maximo: number;

  @Expose()
  @Type(() => MateriaResponseDto)
  materia: MateriaResponseDto;

  @Expose()
  @Type(() => ProfesorSimpleResponseDto)
  profesor: ProfesorSimpleResponseDto;

  @Expose()
  @Type(() => HorarioResponseDto)
  horarios: HorarioResponseDto[];

  @Expose()
  @Type(() => InscripcionResponseDto)
  usuarios: InscripcionResponseDto[];

  @Expose()
  @Type(() => EventoResponseDto)
  eventos: EventoResponseDto[];
}

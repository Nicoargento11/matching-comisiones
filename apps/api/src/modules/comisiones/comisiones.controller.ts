import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ComisionesService } from './comisiones.service';
import { AddEstudianteDto } from './dto/add-estudiante.dto';
import { TrasladarEstudianteDto } from './dto/trasladar-estudiante.dto';
import { CreateHorarioDto } from './dto/create-horario.dto';
import { CreateEventoDto } from './dto/create-evento.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';
import { PaginacionDto } from '../../common/dto/paginacion.dto';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Comisiones')
@Controller('comisiones')
export class ComisionesController {
  constructor(private readonly comisionesService: ComisionesService) {}

  /**
   * Obtiene todas las comisiones con paginación
   * @param paginacionDto - Parámetros de paginación (página, límite, orden)
   * @returns Lista paginada de comisiones con metadatos
   */
  @Get()
  @ApiOperation({ summary: 'Obtener todas las comisiones' })
  @ApiQuery({ name: 'pagina', required: false, type: Number })
  @ApiQuery({ name: 'limite', required: false, type: Number })
  @ApiQuery({ name: 'ordenarPor', required: false, type: String })
  @ApiQuery({ name: 'direccion', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, description: 'Lista paginada de comisiones' })
  obtenerTodas(@Query() paginacionDto: PaginacionDto) {
    return this.comisionesService.obtenerTodas(paginacionDto);
  }

  /**
   * Obtiene el detalle completo de una comisión por su ID
   * @param idComision - ID de la comisión
   * @returns Detalle completo de la comisión con horarios y eventos
   * @throws NotFoundException si no existe la comisión
   */
  @Get(':id_comision')
  @ApiOperation({ summary: 'Obtener detalle de una comisión' })
  @ApiParam({ name: 'id_comision', type: Number })
  @ApiResponse({ status: 200, description: 'Detalle completo de la comisión' })
  @ApiResponse({ status: 404, description: 'Comisión no encontrada' })
  obtenerDetalleComision(
    @Param('id_comision', ParseIntPipe) idComision: number,
  ) {
    return this.comisionesService.obtenerDetalleComision(idComision);
  }

  /**
   * Obtiene las comisiones en las que está inscrito un usuario
   * @param idUsuario - ID del usuario
   * @returns Lista de comisiones del usuario
   * @throws NotFoundException si no existe el usuario
   */
  @Get('usuarios/:id_usuario')
  @ApiOperation({ summary: 'Obtener comisiones de un usuario' })
  @ApiParam({ name: 'id_usuario', type: Number })
  @ApiResponse({ status: 200, description: 'Lista de comisiones del usuario' })
  obtenerComisionesDeUsuario(
    @Param('id_usuario', ParseIntPipe) idUsuario: number,
  ) {
    return this.comisionesService.obtenerComisionesDeUsuario(idUsuario);
  }

  /**
   * Incorpora un estudiante a una comisión (requiere rol profesor o admin)
   * @param idComision - ID de la comisión
   * @param dto - Datos del estudiante a incorporar
   * @returns Inscripción creada
   * @throws NotFoundException si no existe la comisión
   * @throws ConflictException si el estudiante ya está en la comisión
   */
  @Post(':id_comision/estudiantes')
  @Roles('profesor', 'admin')
  @ApiOperation({ summary: 'Incorporar un estudiante a la comisión' })
  @ApiParam({ name: 'id_comision', type: Number })
  @ApiBody({ type: AddEstudianteDto })
  @ApiResponse({ status: 201, description: 'Estudiante incorporado' })
  @ApiResponse({ status: 404, description: 'Comisión no encontrada' })
  @ApiResponse({
    status: 409,
    description: 'El estudiante ya está en la comisión',
  })
  agregarEstudiante(
    @Param('id_comision', ParseIntPipe) idComision: number,
    @Body() dto: AddEstudianteDto,
  ) {
    return this.comisionesService.agregarEstudiante(idComision, dto);
  }

  /**
   * Traslada un estudiante de su comisión actual a esta comisión (misma materia)
   * @param idComision - ID de la comisión destino
   * @param dto - Datos del estudiante a trasladar
   * @throws NotFoundException si no existe la comisión o el alumno no tiene inscripción en la materia
   */
  @Post(':id_comision/estudiantes/trasladar')
  @Roles('profesor')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trasladar estudiante a esta comisión' })
  @ApiParam({ name: 'id_comision', type: Number })
  @ApiBody({ type: TrasladarEstudianteDto })
  @ApiResponse({ status: 200, description: 'Estudiante trasladado' })
  @ApiResponse({
    status: 404,
    description: 'Comisión o inscripción no encontrada',
  })
  trasladarEstudiante(
    @Param('id_comision', ParseIntPipe) idComision: number,
    @Body() dto: TrasladarEstudianteDto,
  ) {
    return this.comisionesService.trasladarEstudiante(
      idComision,
      dto.id_usuario,
    );
  }

  /**
   * Da de baja un estudiante de una comisión (requiere rol profesor o admin)
   * @param idComision - ID de la comisión
   * @param idUsuario - ID del estudiante a dar de baja
   * @returns Sin contenido (204 No Content)
   * @throws NotFoundException si no existe la inscripción
   */
  @Delete(':id_comision/estudiantes/:id_usuario')
  @Roles('profesor', 'admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Dar de baja un estudiante de la comisión' })
  @ApiParam({ name: 'id_comision', type: Number })
  @ApiParam({ name: 'id_usuario', type: Number })
  @ApiResponse({ status: 204, description: 'Estudiante dado de baja' })
  @ApiResponse({ status: 404, description: 'Inscripción no encontrada' })
  darBajaEstudiante(
    @Param('id_comision', ParseIntPipe) idComision: number,
    @Param('id_usuario', ParseIntPipe) idUsuario: number,
  ) {
    return this.comisionesService.darBajaEstudiante(idComision, idUsuario);
  }

  /**
   * Agrega un horario a una comisión (requiere rol profesor o admin)
   * @param idComision - ID de la comisión
   * @param dto - Datos del horario a crear
   * @returns Horario creado
   * @throws NotFoundException si no existe la comisión
   */
  @Post(':id_comision/horarios')
  @Roles('profesor', 'admin')
  @ApiOperation({ summary: 'Agregar un horario a la comisión' })
  @ApiParam({ name: 'id_comision', type: Number })
  @ApiBody({ type: CreateHorarioDto })
  @ApiResponse({ status: 201, description: 'Horario creado' })
  @ApiResponse({ status: 404, description: 'Comisión no encontrada' })
  agregarHorario(
    @Param('id_comision', ParseIntPipe) idComision: number,
    @Body() dto: CreateHorarioDto,
  ) {
    return this.comisionesService.agregarHorario(idComision, dto);
  }

  /**
   * Da de baja (soft delete) un horario de una comisión (requiere rol profesor o admin)
   * @param idComision - ID de la comisión
   * @param idHorario - ID del horario a dar de baja
   * @returns Sin contenido (204 No Content)
   * @throws NotFoundException si no existe el horario
   */
  @Delete(':id_comision/horarios/:id_horario')
  @Roles('profesor', 'admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Dar de baja (soft delete) un horario de la comisión',
  })
  @ApiParam({ name: 'id_comision', type: Number })
  @ApiParam({ name: 'id_horario', type: Number })
  @ApiResponse({ status: 204, description: 'Horario dado de baja' })
  @ApiResponse({ status: 404, description: 'Horario no encontrado' })
  eliminarHorario(
    @Param('id_comision', ParseIntPipe) idComision: number,
    @Param('id_horario', ParseIntPipe) idHorario: number,
  ) {
    return this.comisionesService.eliminarHorario(idComision, idHorario);
  }

  /**
   * Reactiva un horario que fue dado de baja (requiere rol profesor o admin)
   * @param idComision - ID de la comisión
   * @param idHorario - ID del horario a reactivar
   * @returns Horario reactivado
   * @throws NotFoundException si no existe el horario
   */
  @Patch(':id_comision/horarios/:id_horario/reactivar')
  @Roles('profesor', 'admin')
  @ApiOperation({ summary: 'Reactivar un horario dado de baja' })
  @ApiParam({ name: 'id_comision', type: Number })
  @ApiParam({ name: 'id_horario', type: Number })
  @ApiResponse({ status: 200, description: 'Horario reactivado' })
  @ApiResponse({ status: 404, description: 'Horario no encontrado' })
  reactivarHorario(
    @Param('id_comision', ParseIntPipe) idComision: number,
    @Param('id_horario', ParseIntPipe) idHorario: number,
  ) {
    return this.comisionesService.reactivarHorario(idComision, idHorario);
  }

  /**
   * Agrega un evento a una comisión (requiere rol profesor o admin)
   * @param idComision - ID de la comisión
   * @param dto - Datos del evento a crear
   * @returns Evento creado
   * @throws NotFoundException si no existe la comisión
   */
  @Post(':id_comision/eventos')
  @Roles('profesor', 'admin')
  @ApiOperation({ summary: 'Agregar un evento a la comisión' })
  @ApiParam({ name: 'id_comision', type: Number })
  @ApiBody({ type: CreateEventoDto })
  @ApiResponse({ status: 201, description: 'Evento creado' })
  @ApiResponse({ status: 404, description: 'Comisión no encontrada' })
  agregarEvento(
    @Param('id_comision', ParseIntPipe) idComision: number,
    @Body() dto: CreateEventoDto,
  ) {
    return this.comisionesService.agregarEvento(idComision, dto);
  }

  /**
   * Modifica un evento existente de una comisión (requiere rol profesor o admin)
   * @param idComision - ID de la comisión
   * @param idEvento - ID del evento a modificar
   * @param dto - Datos parcial del evento a actualizar
   * @returns Evento modificado
   * @throws NotFoundException si no existe el evento
   */
  @Patch(':id_comision/eventos/:id_evento')
  @Roles('profesor', 'admin')
  @ApiOperation({ summary: 'Modificar un evento de la comisión' })
  @ApiParam({ name: 'id_comision', type: Number })
  @ApiParam({ name: 'id_evento', type: Number })
  @ApiBody({ type: UpdateEventoDto })
  @ApiResponse({ status: 200, description: 'Evento modificado' })
  @ApiResponse({ status: 404, description: 'Evento no encontrado' })
  modificarEvento(
    @Param('id_comision', ParseIntPipe) idComision: number,
    @Param('id_evento', ParseIntPipe) idEvento: number,
    @Body() dto: UpdateEventoDto,
  ) {
    return this.comisionesService.modificarEvento(idComision, idEvento, dto);
  }

  /**
   * Da de baja (soft delete) un evento de una comisión (requiere rol profesor o admin)
   * @param idComision - ID de la comisión
   * @param idEvento - ID del evento a dar de baja
   * @returns Sin contenido (204 No Content)
   * @throws NotFoundException si no existe el evento
   */
  @Delete(':id_comision/eventos/:id_evento')
  @Roles('profesor', 'admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Dar de baja (soft delete) un evento de la comisión',
  })
  @ApiParam({ name: 'id_comision', type: Number })
  @ApiParam({ name: 'id_evento', type: Number })
  @ApiResponse({ status: 204, description: 'Evento dado de baja' })
  @ApiResponse({ status: 404, description: 'Evento no encontrado' })
  eliminarEvento(
    @Param('id_comision', ParseIntPipe) idComision: number,
    @Param('id_evento', ParseIntPipe) idEvento: number,
  ) {
    return this.comisionesService.eliminarEvento(idComision, idEvento);
  }

  /**
   * Reactiva un evento que fue dado de baja (requiere rol profesor o admin)
   * @param idComision - ID de la comisión
   * @param idEvento - ID del evento a reactivar
   * @returns Evento reactivado
   * @throws NotFoundException si no existe el evento
   */
  @Patch(':id_comision/eventos/:id_evento/reactivar')
  @Roles('profesor', 'admin')
  @ApiOperation({ summary: 'Reactivar un evento dado de baja' })
  @ApiParam({ name: 'id_comision', type: Number })
  @ApiParam({ name: 'id_evento', type: Number })
  @ApiResponse({ status: 200, description: 'Evento reactivado' })
  @ApiResponse({ status: 404, description: 'Evento no encontrado' })
  reactivarEvento(
    @Param('id_comision', ParseIntPipe) idComision: number,
    @Param('id_evento', ParseIntPipe) idEvento: number,
  ) {
    return this.comisionesService.reactivarEvento(idComision, idEvento);
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ComisionesService } from './comisiones.service';
import { AddEstudianteDto } from './dto/add-estudiante.dto';
import { CreateHorarioDto } from './dto/create-horario.dto';
import { CreateEventoDto } from './dto/create-evento.dto';

@ApiTags('Comisiones')
@Controller('comisiones')
export class ComisionesController {
  constructor(private readonly comisionesService: ComisionesService) {}

  @Get(':id_comision')
  @ApiOperation({ summary: 'Obtener detalle de una comisión' })
  @ApiParam({ name: 'id_comision', type: Number })
  @ApiResponse({ status: 200, description: 'Detalle completo de la comisión' })
  @ApiResponse({ status: 404, description: 'Comisión no encontrada' })
  ObtenerDetalleComision(
    @Param('id_comision', ParseIntPipe) idComision: number,
  ) {
    return this.comisionesService.ObtenerDetalleComision(idComision);
  }

  @Get('usuarios/:id_usuario')
  @ApiOperation({ summary: 'Obtener comisiones de un usuario' })
  @ApiParam({ name: 'id_usuario', type: Number })
  @ApiResponse({ status: 200, description: 'Lista de comisiones del usuario' })
  ObtenerComisionesDeUsuario(
    @Param('id_usuario', ParseIntPipe) idUsuario: number,
  ) {
    return this.comisionesService.ObtenerComisionesDeUsuario(idUsuario);
  }

  @Post(':id_comision/estudiantes')
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

  @Delete(':id_comision/estudiantes/:id_usuario')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Dar de baja un estudiante de la comisión' })
  @ApiParam({ name: 'id_comision', type: Number })
  @ApiParam({ name: 'id_usuario', type: Number })
  @ApiResponse({ status: 204, description: 'Estudiante dado de baja' })
  @ApiResponse({ status: 404, description: 'Inscripción no encontrada' })
  quitarEstudiante(
    @Param('id_comision', ParseIntPipe) idComision: number,
    @Param('id_usuario', ParseIntPipe) idUsuario: number,
  ) {
    return this.comisionesService.darBajaEstudiante(idComision, idUsuario);
  }

  @Post(':id_comision/horarios')
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

  @Delete(':id_comision/horarios/:id_horario')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un horario de la comisión' })
  @ApiParam({ name: 'id_comision', type: Number })
  @ApiParam({ name: 'id_horario', type: Number })
  @ApiResponse({ status: 204, description: 'Horario eliminado' })
  @ApiResponse({ status: 404, description: 'Horario no encontrado' })
  quitarHorario(
    @Param('id_comision', ParseIntPipe) idComision: number,
    @Param('id_horario', ParseIntPipe) idHorario: number,
  ) {
    return this.comisionesService.eliminarHorario(idComision, idHorario);
  }

  @Post(':id_comision/eventos')
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

  @Delete(':id_comision/eventos/:id_evento')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un evento de la comisión' })
  @ApiParam({ name: 'id_comision', type: Number })
  @ApiParam({ name: 'id_evento', type: Number })
  @ApiResponse({ status: 204, description: 'Evento eliminado' })
  @ApiResponse({ status: 404, description: 'Evento no encontrado' })
  quitarEvento(
    @Param('id_comision', ParseIntPipe) idComision: number,
    @Param('id_evento', ParseIntPipe) idEvento: number,
  ) {
    return this.comisionesService.eliminarEvento(idComision, idEvento);
  }
}

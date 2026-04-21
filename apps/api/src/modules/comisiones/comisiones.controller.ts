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
import { ComisionesService } from './comisiones.service';
import { AddEstudianteDto } from './dto/add-estudiante.dto';
import { CreateHorarioDto } from './dto/create-horario.dto';
import { CreateEventoDto } from './dto/create-evento.dto';

@Controller('comisiones')
export class ComisionesController {
  constructor(private readonly comisionesService: ComisionesService) {}

  @Get(':id_comision')
  ObtenerDetalleComision(
    @Param('id_comision', ParseIntPipe) idComision: number,
  ) {
    return this.comisionesService.ObtenerDetalleComision(idComision);
  }

  // obtener detalle de todas las comisiones de un usuario
  @Get('usuarios/:id_usuario')
  ObtenerComisionesDeUsuario(
    @Param('id_usuario', ParseIntPipe) idUsuario: number,
  ) {
    return this.comisionesService.ObtenerComisionesDeUsuario(idUsuario);
  }

  @Post(':id_comision/estudiantes')
  agregarEstudiante(
    @Param('id_comision', ParseIntPipe) idComision: number,
    @Body() dto: AddEstudianteDto,
  ) {
    return this.comisionesService.agregarEstudiante(idComision, dto);
  }

  @Delete(':id_comision/estudiantes/:id_usuario')
  @HttpCode(HttpStatus.NO_CONTENT)
  quitarEstudiante(
    @Param('id_comision', ParseIntPipe) idComision: number,
    @Param('id_usuario', ParseIntPipe) idUsuario: number,
  ) {
    return this.comisionesService.darBajaEstudiante(idComision, idUsuario);
  }

  @Post(':id_comision/horarios')
  agregarHorario(
    @Param('id_comision', ParseIntPipe) idComision: number,
    @Body() dto: CreateHorarioDto,
  ) {
    return this.comisionesService.agregarHorario(idComision, dto);
  }

  @Delete(':id_comision/horarios/:id_horario')
  @HttpCode(HttpStatus.NO_CONTENT)
  quitarHorario(
    @Param('id_comision', ParseIntPipe) idComision: number,
    @Param('id_horario', ParseIntPipe) idHorario: number,
  ) {
    return this.comisionesService.eliminarHorario(idComision, idHorario);
  }

  @Post(':id_comision/eventos')
  agregarEvento(
    @Param('id_comision', ParseIntPipe) idComision: number,
    @Body() dto: CreateEventoDto,
  ) {
    return this.comisionesService.agregarEvento(idComision, dto);
  }

  @Delete(':id_comision/eventos/:id_evento')
  @HttpCode(HttpStatus.NO_CONTENT)
  quitarEvento(
    @Param('id_comision', ParseIntPipe) idComision: number,
    @Param('id_evento', ParseIntPipe) idEvento: number,
  ) {
    return this.comisionesService.eliminarEvento(idComision, idEvento);
  }
}

import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProfesoresService } from './profesores.service';

@ApiTags('Profesores')
@Controller('profesores')
export class ProfesoresController {
  constructor(private readonly profesoresService: ProfesoresService) {}

  @Get(':id_profesor/comisiones')
  @ApiOperation({ summary: 'Obtener todas las comisiones de un profesor' })
  @ApiParam({ name: 'id_profesor', type: Number })
  @ApiResponse({ status: 200, description: 'Lista de comisiones del profesor' })
  @ApiResponse({ status: 404, description: 'Profesor no encontrado' })
  getComisiones(@Param('id_profesor', ParseIntPipe) idProfesor: number) {
    return this.profesoresService.obtenerComisiones(idProfesor);
  }

  @Get(':id_profesor/comision')
  @ApiOperation({ summary: 'Obtener la comisión asignada a un profesor' })
  @ApiParam({ name: 'id_profesor', type: Number })
  @ApiResponse({ status: 200, description: 'Comisión del profesor' })
  @ApiResponse({ status: 404, description: 'Profesor sin comisión asignada' })
  getComision(@Param('id_profesor', ParseIntPipe) idProfesor: number) {
    return this.profesoresService.obtenerComision(idProfesor);
  }
}

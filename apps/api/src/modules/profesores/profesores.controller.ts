import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProfesoresService } from './profesores.service';

@ApiTags('Profesores')
@Controller('profesores')
export class ProfesoresController {
  constructor(private readonly profesoresService: ProfesoresService) {}

  /**
   * Obtiene todas las comisiones asignadas a un profesor
   * @param idProfesor - ID del profesor
   * @returns Lista de comisiones del profesor
   * @throws NotFoundException si no existe el profesor
   */
  @Get(':id_profesor/comisiones')
  @ApiOperation({ summary: 'Obtener todas las comisiones de un profesor' })
  @ApiParam({ name: 'id_profesor', type: Number })
  @ApiResponse({ status: 200, description: 'Lista de comisiones del profesor' })
  @ApiResponse({ status: 404, description: 'Profesor no encontrado' })
  obtenerComisiones(@Param('id_profesor', ParseIntPipe) idProfesor: number) {
    return this.profesoresService.obtenerComisiones(idProfesor);
  }

  /**
   * Obtiene la primera comisión asignada a un profesor
   * @param idProfesor - ID del profesor
   * @returns Comisión asignada al profesor
   * @throws NotFoundException si el profesor no tiene comisión asignada
   */
  @Get(':id_profesor/comision')
  @ApiOperation({ summary: 'Obtener la comisión asignada a un profesor' })
  @ApiParam({ name: 'id_profesor', type: Number })
  @ApiResponse({ status: 200, description: 'Comisión del profesor' })
  @ApiResponse({ status: 404, description: 'Profesor sin comisión asignada' })
  obtenerComision(@Param('id_profesor', ParseIntPipe) idProfesor: number) {
    return this.profesoresService.obtenerComision(idProfesor);
  }
}

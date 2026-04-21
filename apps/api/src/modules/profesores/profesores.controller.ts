import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ProfesoresService } from './profesores.service';

@Controller('profesores')
export class ProfesoresController {
  constructor(private readonly profesoresService: ProfesoresService) {}

  // Endpoint para obtener las comisiones de un profesor
  @Get(':id_profesor/comisiones')
  getComisiones(@Param('id_profesor', ParseIntPipe) idProfesor: number) {
    return this.profesoresService.obtenerComisiones(idProfesor);
  }

  // Endpoint para obtener la comisión de un profesor
  @Get(':id_profesor/comision')
  getComision(@Param('id_profesor', ParseIntPipe) idProfesor: number) {
    return this.profesoresService.obtenerComision(idProfesor);
  }
}

import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ProfesoresService } from './profesores.service';

@Controller('profesores')
export class ProfesoresController {
  constructor(private readonly profesoresService: ProfesoresService) {}

  // Endpoint para obtener las comisiones de un profesor
  @Get(':id_usuario/comisiones')
  getComisiones(@Param('id_usuario', ParseIntPipe) idUsuario: number) {
    return this.profesoresService.obtenerComisiones(idUsuario);
  }

  // Endpoint para obtener la comision de un profesor
  @Get(':id_usuario/comision')
  getComision(@Param('id_usuario', ParseIntPipe) idUsuario: number) {
    return this.profesoresService.obtenerComision(idUsuario);
  }
}

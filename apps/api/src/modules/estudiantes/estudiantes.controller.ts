import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { EstudiantesService } from './estudiantes.service';

@ApiTags('Estudiantes')
@Controller('estudiantes')
@Roles('estudiante', 'profesor')
export class EstudiantesController {
  constructor(private readonly estudiantesService: EstudiantesService) {}

  @Get(':id_estudiante/comisiones')
  @ApiOperation({ summary: 'Obtener todas las comisiones de un estudiante' })
  @ApiParam({ name: 'id_estudiante', type: Number })
  @ApiResponse({ status: 200, description: 'Lista de comisiones del estudiante' })
  @ApiResponse({ status: 404, description: 'Estudiante no encontrado' })
  obtenerComisiones(@Param('id_estudiante', ParseIntPipe) idEstudiante: number) {
    return this.estudiantesService.obtenerComisiones(idEstudiante);
  }
}

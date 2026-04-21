import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsuariosService } from './usuarios.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@ApiTags('Usuarios')
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get('me')
  @ApiOperation({ summary: 'Obtener el usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Datos del usuario del token' })
  getMe(@CurrentUser() user: unknown) {
    return user;
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los estudiantes' })
  @ApiResponse({ status: 200, description: 'Lista de estudiantes' })
  ObtenerEstudiantes() {
    return this.usuariosService.ObtenerEstudiantes();
  }

  @Get(':id_usuario')
  @ApiOperation({ summary: 'Obtener un estudiante por ID' })
  @ApiParam({ name: 'id_usuario', type: Number })
  @ApiResponse({ status: 200, description: 'Datos del estudiante' })
  @ApiResponse({ status: 404, description: 'Estudiante no encontrado' })
  ObtenerEstudiante(@Param('id_usuario', ParseIntPipe) idUsuario: number) {
    return this.usuariosService.ObtenerEstudiante(idUsuario);
  }

  @Get(':id_usuario/comisiones')
  @ApiOperation({ summary: 'Obtener comisiones de un estudiante' })
  @ApiParam({ name: 'id_usuario', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Lista de comisiones del estudiante',
  })
  @ApiResponse({ status: 404, description: 'Estudiante no encontrado' })
  ObtenerComisiones(@Param('id_usuario', ParseIntPipe) idUsuario: number) {
    return this.usuariosService.ObtenerComisionesDeEstudiante(idUsuario);
  }

  @Get(':id_usuario/conversaciones')
  @ApiOperation({ summary: 'Obtener conversaciones de un usuario' })
  @ApiParam({ name: 'id_usuario', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Lista de conversaciones con último mensaje',
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  ObtenerConversaciones(@Param('id_usuario', ParseIntPipe) idUsuario: number) {
    return this.usuariosService.ObtenerConversaciones(idUsuario);
  }
}

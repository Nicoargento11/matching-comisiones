import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get('me')
  getMe(@CurrentUser() user: unknown) {
    return user;
  }

  // Endpoints dinámicos para obtener el primer usuario válido según BD real (para evitar IDs hardcodeados temporalmente)
  @Get('mock/estudiante')
  ObtenerPrimerEstudiante() {
    return this.usuariosService.ObtenerPrimerEstudianteUsuarioId();
  }

  @Get('mock/profesor')
  ObtenerPrimerProfesor() {
    return this.usuariosService.ObtenerPrimerProfesorUsuarioId();
  }

  // Endpoint para obtener los datos de un estudiante por su ID
  @Get(':id_usuario')
  ObtenerEstudiante(@Param('id_usuario', ParseIntPipe) idUsuario: number) {
    return this.usuariosService.ObtenerEstudiante(idUsuario);
  }

  // Endpoint para obtener las comisiones de un estudiante
  @Get(':id_usuario/comisiones')
  ObtenerComisiones(@Param('id_usuario', ParseIntPipe) idUsuario: number) {
    return this.usuariosService.ObtenerComisionesDeEstudiante(idUsuario);
  }

  @Get(':id_usuario/conversaciones')
  ObtenerConversaciones(@Param('id_usuario', ParseIntPipe) idUsuario: number) {
    return this.usuariosService.ObtenerConversaciones(idUsuario);
  }
}

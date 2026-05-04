import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UsuariosService } from './usuarios.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { PaginacionDto } from '../../common/dto/paginacion.dto';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Usuarios')
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  /**
   * Retorna los datos del usuario autenticado extraídos del token JWT
   * @param user - Claims del usuario extraídos del token por AuthGuard
   * @returns Datos del usuario autenticado
   */
  @Get('me')
  @ApiOperation({ summary: 'Obtener el usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Datos del usuario del token' })
  obtenerMe(@CurrentUser() user: unknown) {
    return user;
  }

  /**
   * Obtiene todos los estudiantes registrados con paginación
   * @param paginacionDto - Parámetros de paginación (página, límite, orden)
   * @returns Lista paginada de estudiantes con metadatos
   */
  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Obtener todos los estudiantes' })
  @ApiQuery({ name: 'pagina', required: false, type: Number })
  @ApiQuery({ name: 'limite', required: false, type: Number })
  @ApiQuery({ name: 'ordenarPor', required: false, type: String })
  @ApiQuery({ name: 'direccion', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, description: 'Lista paginada de estudiantes' })
  obtenerEstudiantes(@Query() paginacionDto: PaginacionDto) {
    return this.usuariosService.obtenerEstudiantes(paginacionDto);
  }

  /**
   * Busca un usuario por su DNI
   * @param dni - DNI del usuario a buscar
   * @returns Datos del usuario encontrado
   * @throws NotFoundException si no existe un usuario con ese DNI
   */
  @Get('dni/:dni')
  @ApiOperation({ summary: 'Buscar un usuario por DNI' })
  @ApiParam({ name: 'dni', type: Number })
  @ApiResponse({ status: 200, description: 'Datos del usuario' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  obtenerPorDni(@Param('dni', ParseIntPipe) dni: number) {
    return this.usuariosService.obtenerPorDni(dni);
  }

  /**
   * Obtiene un estudiante por su ID
   * @param idUsuario - ID del estudiante a buscar
   * @returns Datos del estudiante encontrado
   * @throws NotFoundException si no existe un estudiante con ese ID
   */
  @Get(':id_usuario')
  @ApiOperation({ summary: 'Obtener un estudiante por ID' })
  @ApiParam({ name: 'id_usuario', type: Number })
  @ApiResponse({ status: 200, description: 'Datos del estudiante' })
  @ApiResponse({ status: 404, description: 'Estudiante no encontrado' })
  obtenerEstudiante(@Param('id_usuario', ParseIntPipe) idUsuario: number) {
    return this.usuariosService.obtenerEstudiante(idUsuario);
  }

  /**
   * Obtiene las comisiones de un estudiante por su ID
   * @param idUsuario - ID del estudiante
   * @returns Lista de comisiones en las que está inscrito el estudiante
   * @throws NotFoundException si no existe el estudiante
   */
  @Get(':id_usuario/comisiones')
  @ApiOperation({ summary: 'Obtener comisiones de un estudiante' })
  @ApiParam({ name: 'id_usuario', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Lista de comisiones del estudiante',
  })
  @ApiResponse({ status: 404, description: 'Estudiante no encontrado' })
  obtenerComisiones(@Param('id_usuario', ParseIntPipe) idUsuario: number) {
    return this.usuariosService.obtenerComisionesDeEstudiante(idUsuario);
  }

  /**
   * Obtiene las conversaciones de un usuario por su ID
   * @param idUsuario - ID del usuario
   * @returns Lista de conversaciones del usuario con último mensaje
   * @throws NotFoundException si no existe el usuario
   */
  @Get(':id_usuario/conversaciones')
  @ApiOperation({ summary: 'Obtener conversaciones de un usuario' })
  @ApiParam({ name: 'id_usuario', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Lista de conversaciones con último mensaje',
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  obtenerConversaciones(@Param('id_usuario', ParseIntPipe) idUsuario: number) {
    return this.usuariosService.obtenerConversaciones(idUsuario);
  }
}

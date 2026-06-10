import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser, CurrentUserClaims } from '../../common/decorators/current-user.decorator';
import { TareasService } from './tareas.service';
import { CreateTareaDto } from './dto/create-tarea.dto';
import { UpdateTareaDto } from './dto/update-tarea.dto';
import { UpdateEstadoDto } from './dto/update-estado.dto';

@ApiTags('Tareas')
@Controller('tareas')
export class TareasController {
  constructor(private readonly tareasService: TareasService) {}

  @Get('usuario/:idUsuario')
  @ApiOperation({ summary: 'Obtener tareas del usuario autenticado' })
  @ApiParam({ name: 'idUsuario', type: Number })
  @ApiResponse({ status: 200, description: 'Lista de tareas del usuario' })
  obtenerMias(
    @Param('idUsuario', ParseIntPipe) _idUsuario: number,
    @CurrentUser() user: CurrentUserClaims,
  ) {
    if (!user.id_usuario) throw new UnauthorizedException('Usuario no autenticado');
    return this.tareasService.obtenerPorUsuario(user.id_usuario);
  }

  @Post()
  @ApiOperation({ summary: 'Crear una nueva tarea' })
  @ApiResponse({ status: 201, description: 'Tarea creada' })
  @ApiResponse({ status: 400, description: 'Columna no encontrada o datos inválidos' })
  crearTarea(@Body() dto: CreateTareaDto, @CurrentUser() user: CurrentUserClaims) {
    if (!user.id_usuario) throw new UnauthorizedException('Usuario no autenticado');
    return this.tareasService.crearTarea(user.id_usuario, dto);
  }

  @Patch(':idTarea')
  @ApiOperation({ summary: 'Actualizar campos de una tarea' })
  @ApiParam({ name: 'idTarea', type: Number })
  @ApiResponse({ status: 200, description: 'Tarea actualizada' })
  @ApiResponse({ status: 403, description: 'Tarea no pertenece al usuario' })
  actualizarTarea(
    @Param('idTarea', ParseIntPipe) idTarea: number,
    @Body() dto: UpdateTareaDto,
    @CurrentUser() user: CurrentUserClaims,
  ) {
    if (!user.id_usuario) throw new UnauthorizedException('Usuario no autenticado');
    return this.tareasService.actualizarTarea(idTarea, user.id_usuario, dto);
  }

  @Patch(':idTarea/estado')
  @ApiOperation({ summary: 'Actualizar estado de una tarea' })
  @ApiParam({ name: 'idTarea', type: Number })
  @ApiResponse({ status: 200, description: 'Estado actualizado' })
  @ApiResponse({ status: 400, description: 'Columna no encontrada' })
  @ApiResponse({ status: 403, description: 'Tarea no pertenece al usuario' })
  moverAColumna(
    @Param('idTarea', ParseIntPipe) idTarea: number,
    @Body() dto: UpdateEstadoDto,
    @CurrentUser() user: CurrentUserClaims,
  ) {
    if (!user.id_usuario) throw new UnauthorizedException('Usuario no autenticado');
    return this.tareasService.moverAColumna(idTarea, dto.estado, user.id_usuario);
  }

  @Delete(':idTarea')
  @HttpCode(204)
  @ApiOperation({ summary: 'Eliminar una tarea' })
  @ApiParam({ name: 'idTarea', type: Number })
  @ApiResponse({ status: 204, description: 'Tarea eliminada' })
  @ApiResponse({ status: 403, description: 'Tarea no pertenece al usuario' })
  async eliminarTarea(
    @Param('idTarea', ParseIntPipe) idTarea: number,
    @CurrentUser() user: CurrentUserClaims,
  ) {
    if (!user.id_usuario) throw new UnauthorizedException('Usuario no autenticado');
    await this.tareasService.eliminarTarea(idTarea, user.id_usuario);
  }
}

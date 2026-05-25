import { Controller, Get, Param, ParseIntPipe, Patch } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NotificacionesService } from './notificaciones.service';

@ApiTags('Notificaciones')
@Controller('notificaciones')
export class NotificacionesController {
  constructor(private readonly notificacionesService: NotificacionesService) {}

  /**
   * Obtiene todas las notificaciones de un usuario
   * @param idUsuario - ID del usuario
   * @returns Lista de notificaciones del usuario
   */
  @Get('usuario/:idUsuario')
  @ApiOperation({ summary: 'Obtener notificaciones de un usuario' })
  @ApiParam({ name: 'idUsuario', type: Number })
  @ApiResponse({ status: 200, description: 'Lista de notificaciones' })
  obtenerPorUsuario(@Param('idUsuario', ParseIntPipe) idUsuario: number) {
    return this.notificacionesService.obtenerPorUsuario(idUsuario);
  }

  /**
   * Marca una notificación específica como leída
   * @param idNotificacion - ID de la notificación a marcar
   * @returns La notificación actualizada
   */
  @Patch(':idNotificacion/leida')
  @ApiOperation({ summary: 'Marcar una notificación como leída' })
  @ApiParam({ name: 'idNotificacion', type: Number })
  @ApiResponse({ status: 200, description: 'Notificación marcada como leída' })
  @ApiResponse({ status: 404, description: 'Notificación no encontrada' })
  marcarLeida(@Param('idNotificacion', ParseIntPipe) idNotificacion: number) {
    return this.notificacionesService.marcarSoloLeida(idNotificacion);
  }

  /**
   * Marca todas las notificaciones de un usuario como leídas
   * @param idUsuario - ID del usuario
   */
  @Patch('usuario/:idUsuario/leidas')
  @ApiOperation({ summary: 'Marcar todas las notificaciones del usuario como leídas' })
  @ApiParam({ name: 'idUsuario', type: Number })
  @ApiResponse({ status: 200, description: 'Notificaciones marcadas como leídas' })
  marcarTodasLeidas(@Param('idUsuario', ParseIntPipe) idUsuario: number) {
    return this.notificacionesService.marcarTodasLeidas(idUsuario);
  }
}

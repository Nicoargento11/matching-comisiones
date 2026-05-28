import { Controller, Get, Param, ParseIntPipe, Patch, UnauthorizedException } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NotificacionesService } from './notificaciones.service';
import { CurrentUser, CurrentUserClaims } from '../../common/decorators/current-user.decorator';

@ApiTags('Notificaciones')
@Controller('notificaciones')
export class NotificacionesController {
  constructor(private readonly notificacionesService: NotificacionesService) {}

  @Get('usuario/:idUsuario')
  @ApiOperation({ summary: 'Obtener notificaciones del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Lista de notificaciones' })
  obtenerPorUsuario(@CurrentUser() user: CurrentUserClaims) {
    if (!user.id_usuario) throw new UnauthorizedException();
    return this.notificacionesService.obtenerPorUsuario(user.id_usuario);
  }

  @Patch(':idNotificacion/leida')
  @ApiOperation({ summary: 'Marcar una notificación como leída' })
  @ApiParam({ name: 'idNotificacion', type: Number })
  @ApiResponse({ status: 200, description: 'Notificación marcada como leída' })
  @ApiResponse({ status: 403, description: 'La notificación no pertenece al usuario' })
  @ApiResponse({ status: 404, description: 'Notificación no encontrada' })
  marcarLeida(
    @Param('idNotificacion', ParseIntPipe) idNotificacion: number,
    @CurrentUser() user: CurrentUserClaims,
  ) {
    if (!user.id_usuario) throw new UnauthorizedException();
    return this.notificacionesService.marcarSoloLeida(idNotificacion, user.id_usuario);
  }

  @Patch('usuario/:idUsuario/leidas')
  @ApiOperation({ summary: 'Marcar todas las notificaciones del usuario autenticado como leídas' })
  @ApiResponse({ status: 200, description: 'Notificaciones marcadas como leídas' })
  marcarTodasLeidas(@CurrentUser() user: CurrentUserClaims) {
    if (!user.id_usuario) throw new UnauthorizedException();
    return this.notificacionesService.marcarTodasLeidas(user.id_usuario);
  }
}

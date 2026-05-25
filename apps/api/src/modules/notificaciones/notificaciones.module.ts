import { Module } from '@nestjs/common';
import { NotificacionesController } from './notificaciones.controller';
import { NotificacionesService } from './notificaciones.service';
import { NotificacionesRepository } from './repositories/notificaciones.repository';

@Module({
  controllers: [NotificacionesController],
  providers: [NotificacionesService, NotificacionesRepository],
  exports: [NotificacionesRepository],
})
export class NotificacionesModule {}

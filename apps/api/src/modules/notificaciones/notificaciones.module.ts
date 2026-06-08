import { Module } from '@nestjs/common';
import { NotificacionesController } from './notificaciones.controller';
import { NotificacionesService } from './notificaciones.service';
import { NotificacionObserver } from './observers/notificacion.observer';
import {
  NotificacionesRepository,
  PrismaNotificacionesRepository,
} from './repositories/notificaciones.repository';

@Module({
  controllers: [NotificacionesController],
  providers: [
    NotificacionesService,
    NotificacionObserver,
    {
      provide: NotificacionesRepository,
      useClass: PrismaNotificacionesRepository,
    },
  ],
  exports: [
    NotificacionesRepository,
    NotificacionesService,
    NotificacionObserver,
  ],
})
export class NotificacionesModule {}

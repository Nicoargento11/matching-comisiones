import { Module } from '@nestjs/common';
import { NotificacionesController } from './notificaciones.controller';
import { NotificacionesService } from './notificaciones.service';
import { NotificacionesMatchingObserver } from './observers/notificaciones-matching.observer';
import {
  NotificacionesRepository,
  PrismaNotificacionesRepository,
} from './repositories/notificaciones.repository';

@Module({
  controllers: [NotificacionesController],
  providers: [
    NotificacionesService,
    NotificacionesMatchingObserver,
    {
      provide: NotificacionesRepository,
      useClass: PrismaNotificacionesRepository,
    },
  ],
  exports: [
    NotificacionesRepository,
    NotificacionesService,
    NotificacionesMatchingObserver,
  ],
})
export class NotificacionesModule {}

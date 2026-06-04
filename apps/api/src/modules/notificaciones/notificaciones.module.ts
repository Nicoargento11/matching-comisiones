import { Module } from '@nestjs/common';
import { NotificacionesController } from './notificaciones.controller';
import { NotificacionesService } from './notificaciones.service';
import { NotificacionesRepository, PrismaNotificacionesRepository } from './repositories/notificaciones.repository';

@Module({
  controllers: [NotificacionesController],
  providers: [NotificacionesService, { provide: NotificacionesRepository, useClass: PrismaNotificacionesRepository }],
  exports: [NotificacionesRepository, NotificacionesService],
})
export class NotificacionesModule {}

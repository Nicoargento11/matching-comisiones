import { Module, OnModuleInit } from '@nestjs/common';
import { ComprobantesModule } from '../comprobantes/comprobantes.module';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';
import { ComprobantesMatchingObserver } from '../comprobantes/observers/comprobantes-matching.observer';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { MatchingController } from './matching.controller';
import { MatchingService } from './matching.service';

@Module({
  imports: [ComprobantesModule, NotificacionesModule],
  controllers: [MatchingController],
  providers: [MatchingService],
})
export class MatchingModule implements OnModuleInit {
  constructor(
    private readonly matchingService: MatchingService,
    private readonly comprobantesObserver: ComprobantesMatchingObserver,
    private readonly notificacionesService: NotificacionesService,
  ) {}

  onModuleInit(): void {
    this.matchingService.registrarObserver(this.comprobantesObserver);
    this.matchingService.registrarObserver(this.notificacionesService);
  }
}

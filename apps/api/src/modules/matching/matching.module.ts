import { Module, OnModuleInit } from '@nestjs/common';
import { ComprobantesModule } from '../comprobantes/comprobantes.module';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';
import { ComprobantesMatchingObserver } from '../comprobantes/observers/comprobantes-matching.observer';
import { NotificacionesMatchingObserver } from '../notificaciones/observers/notificaciones-matching.observer';
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
    private readonly notificacionesObserver: NotificacionesMatchingObserver,
  ) {}

  onModuleInit(): void {
    this.matchingService.registrarObserver(this.comprobantesObserver);
    this.matchingService.registrarObserver(this.notificacionesObserver);
  }
}

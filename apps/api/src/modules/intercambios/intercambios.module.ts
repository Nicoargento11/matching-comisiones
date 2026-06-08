import { Module, OnModuleInit } from '@nestjs/common';
import { IntercambiosController } from './intercambios.controller';
import { IntercambiosService } from './intercambios.service';
import { IntercambiosRepository, PrismaIntercambiosRepository } from './repositories/intercambios.repository';
import { ComprobantesModule } from '../comprobantes/comprobantes.module';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';
import { EmailModule } from '../email/email.module';
import { IntercambioCompletadoSubject } from './observers/intercambio-completado.subject';
import { ComprobanteObserver } from '../comprobantes/observers/comprobante.observer';
import { NotificacionObserver } from '../notificaciones/observers/notificacion.observer';
import { EmailObserver } from './observers/email.observer';

@Module({
  imports: [ComprobantesModule, NotificacionesModule, EmailModule],
  controllers: [IntercambiosController],
  providers: [
    IntercambiosService,
    { provide: IntercambiosRepository, useClass: PrismaIntercambiosRepository },
    IntercambioCompletadoSubject,
    ComprobanteObserver,
    NotificacionObserver,
    EmailObserver,
  ],
  exports: [IntercambiosService],
})
export class IntercambiosModule implements OnModuleInit {
  constructor(
    private readonly subject: IntercambioCompletadoSubject,
    private readonly comprobanteObserver: ComprobanteObserver,
    private readonly notificacionObserver: NotificacionObserver,
    private readonly emailObserver: EmailObserver,
  ) {}

  /**
   * Registra los observers de `IntercambioCompletado` en el subject. El orden
   * de registro es irrelevante para la ejecución (el subject clasifica por
   * `failureMode`, no por orden de registro — ver `IntercambioCompletadoSubject`).
   */
  onModuleInit(): void {
    this.subject.registrarObserver(this.comprobanteObserver);
    this.subject.registrarObserver(this.notificacionObserver);
    this.subject.registrarObserver(this.emailObserver);
  }
}

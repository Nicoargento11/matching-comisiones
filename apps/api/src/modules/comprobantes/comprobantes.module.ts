import { Module } from '@nestjs/common';
import { ComprobantesMatchingObserver } from './observers/comprobantes-matching.observer';
import { ComprobantePdfService } from './services/comprobante-pdf.service';
import { ComprobantesStorageService } from './services/comprobantes-storage.service';
import { ComprobantesRepository, PrismaComprobantesRepository } from './repositories/comprobantes.repository';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { ComisionesModule } from '../comisiones/comisiones.module';

@Module({
  imports: [UsuariosModule, ComisionesModule],
  providers: [
    ComprobantePdfService,
    ComprobantesStorageService,
    { provide: ComprobantesRepository, useClass: PrismaComprobantesRepository },
    ComprobantesMatchingObserver,
  ],
  exports: [ComprobantePdfService, ComprobantesStorageService, ComprobantesRepository, ComprobantesMatchingObserver],
})
export class ComprobantesModule {}

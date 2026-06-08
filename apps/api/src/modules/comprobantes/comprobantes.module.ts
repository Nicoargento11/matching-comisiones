import { Module } from '@nestjs/common';
import { ComprobanteObserver } from './observers/comprobante.observer';
import { ComprobantePdfService } from './services/comprobante-pdf.service';
import { ComprobantesStorageService } from './services/comprobantes-storage.service';
import { ComprobantesRepository, PrismaComprobantesRepository } from './repositories/comprobantes.repository';

@Module({
  providers: [
    ComprobantePdfService,
    ComprobantesStorageService,
    { provide: ComprobantesRepository, useClass: PrismaComprobantesRepository },
    ComprobanteObserver,
  ],
  exports: [ComprobantePdfService, ComprobantesStorageService, ComprobantesRepository, ComprobanteObserver],
})
export class ComprobantesModule {}

import { Module } from '@nestjs/common';
import { ComprobantesMatchingObserver } from './observers/comprobantes-matching.observer';
import { ComprobantePdfService } from './services/comprobante-pdf.service';
import { ComprobantesStorageService } from './services/comprobantes-storage.service';
import { ComprobantesRepository, PrismaComprobantesRepository } from './repositories/comprobantes.repository';

@Module({
  providers: [
    ComprobantePdfService,
    ComprobantesStorageService,
    { provide: ComprobantesRepository, useClass: PrismaComprobantesRepository },
    ComprobantesMatchingObserver,
  ],
  exports: [ComprobantePdfService, ComprobantesStorageService, ComprobantesRepository, ComprobantesMatchingObserver],
})
export class ComprobantesModule {}

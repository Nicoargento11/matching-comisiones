import { Module } from '@nestjs/common';
import { ComprobantePdfService } from './services/comprobante-pdf.service';
import { ComprobantesStorageService } from './services/comprobantes-storage.service';
import { ComprobantesRepository, PrismaComprobantesRepository } from './repositories/comprobantes.repository';

@Module({
  providers: [ComprobantePdfService, ComprobantesStorageService, { provide: ComprobantesRepository, useClass: PrismaComprobantesRepository }],
  exports: [ComprobantePdfService, ComprobantesStorageService, ComprobantesRepository],
})
export class ComprobantesModule {}

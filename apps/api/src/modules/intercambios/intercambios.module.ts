import { Module } from '@nestjs/common';
import { IntercambiosController } from './intercambios.controller';
import { IntercambiosService } from './intercambios.service';
import { IntercambiosRepository, PrismaIntercambiosRepository } from './repositories/intercambios.repository';
import { ComprobantesModule } from '../comprobantes/comprobantes.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [ComprobantesModule, EmailModule],
  controllers: [IntercambiosController],
  providers: [IntercambiosService, { provide: IntercambiosRepository, useClass: PrismaIntercambiosRepository }],
})
export class IntercambiosModule {}

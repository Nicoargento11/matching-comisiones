import { Module } from '@nestjs/common';
import { MensajesController } from './mensajes.controller';
import { MensajesService } from './mensajes.service';
import { MensajesRepository, PrismaMensajesRepository } from './repositories/mensajes.repository';

@Module({
  controllers: [MensajesController],
  providers: [MensajesService, { provide: MensajesRepository, useClass: PrismaMensajesRepository }],
})
export class MensajesModule {}

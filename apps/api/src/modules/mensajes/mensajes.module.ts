import { Module } from '@nestjs/common';
import { MensajesController } from './mensajes.controller';
import { MensajesService } from './mensajes.service';
import { MensajesRepository } from './repositories/mensajes.repository';

@Module({
  controllers: [MensajesController],
  providers: [MensajesService, MensajesRepository],
})
export class MensajesModule {}

import { Module } from '@nestjs/common';
import { IntercambiosController } from './intercambios.controller';
import { IntercambiosService } from './intercambios.service';
import { IntercambiosRepository } from './repositories/intercambios.repository';

@Module({
  controllers: [IntercambiosController],
  providers: [IntercambiosService, IntercambiosRepository],
})
export class IntercambiosModule {}

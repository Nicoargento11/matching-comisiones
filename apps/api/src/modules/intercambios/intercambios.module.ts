import { Module } from '@nestjs/common';
import { IntercambiosController } from './intercambios.controller';
import { IntercambiosService } from './intercambios.service';

@Module({
  controllers: [IntercambiosController],
  providers: [IntercambiosService],
})
export class IntercambiosModule {}

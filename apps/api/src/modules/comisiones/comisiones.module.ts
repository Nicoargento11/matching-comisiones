import { Module } from '@nestjs/common';
import { ComisionesController } from './comisiones.controller';
import { ComisionesService } from './comisiones.service';
import { ComisionesRepository } from './repositories/comisiones.repository';

@Module({
  controllers: [ComisionesController],
  providers: [ComisionesService, ComisionesRepository],
  exports: [ComisionesService],
})
export class ComisionesModule {}

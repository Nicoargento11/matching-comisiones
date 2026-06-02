import { Module } from '@nestjs/common';
import { ColumnasController } from './columnas.controller';
import { ColumnasService } from './columnas.service';
import { ColumnasRepository } from './repositories/columnas.repository';

@Module({
  controllers: [ColumnasController],
  providers: [ColumnasService, ColumnasRepository],
  exports: [ColumnasRepository],
})
export class ColumnasModule {}

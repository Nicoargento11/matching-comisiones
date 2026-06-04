import { Module } from '@nestjs/common';
import { ColumnasController } from './columnas.controller';
import { ColumnasService } from './columnas.service';
import { ColumnasRepository, PrismaColumnasRepository } from './repositories/columnas.repository';

@Module({
  controllers: [ColumnasController],
  providers: [ColumnasService, { provide: ColumnasRepository, useClass: PrismaColumnasRepository }],
  exports: [ColumnasRepository],
})
export class ColumnasModule {}

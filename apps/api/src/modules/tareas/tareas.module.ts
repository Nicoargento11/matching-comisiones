import { Module } from '@nestjs/common';
import { TareasController } from './tareas.controller';
import { TareasService } from './tareas.service';
import { TareasRepository, PrismaTareasRepository } from './repositories/tareas.repository';

@Module({
  controllers: [TareasController],
  providers: [TareasService, { provide: TareasRepository, useClass: PrismaTareasRepository }],
  exports: [TareasRepository],
})
export class TareasModule {}

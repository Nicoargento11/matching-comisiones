import { Module } from '@nestjs/common';
import { TareasController } from './tareas.controller';
import { TareasService } from './tareas.service';
import { TareasRepository } from './repositories/tareas.repository';

@Module({
  controllers: [TareasController],
  providers: [TareasService, TareasRepository],
  exports: [TareasRepository],
})
export class TareasModule {}

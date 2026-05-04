import { Module } from '@nestjs/common';
import { ProfesoresController } from './profesores.controller';
import { ProfesoresService } from './profesores.service';
import { ProfesoresRepository } from './repositories/profesores.repository';

@Module({
  controllers: [ProfesoresController],
  providers: [ProfesoresService, ProfesoresRepository],
})
export class ProfesoresModule {}

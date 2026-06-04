import { Module } from '@nestjs/common';
import { ProfesoresController } from './profesores.controller';
import { ProfesoresService } from './profesores.service';
import { ProfesoresRepository, PrismaProfesoresRepository } from './repositories/profesores.repository';

@Module({
  controllers: [ProfesoresController],
  providers: [ProfesoresService, { provide: ProfesoresRepository, useClass: PrismaProfesoresRepository }],
})
export class ProfesoresModule {}

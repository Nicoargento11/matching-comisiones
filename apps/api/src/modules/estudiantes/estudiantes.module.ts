import { Module } from '@nestjs/common';
import { EstudiantesController } from './estudiantes.controller';
import { EstudiantesService } from './estudiantes.service';
import { EstudiantesRepository, PrismaEstudiantesRepository } from './repositories/estudiantes.repository';

@Module({
  controllers: [EstudiantesController],
  providers: [EstudiantesService, { provide: EstudiantesRepository, useClass: PrismaEstudiantesRepository }],
})
export class EstudiantesModule {}

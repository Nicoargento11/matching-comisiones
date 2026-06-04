import { Module } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { UsuariosController } from './usuarios.controller';
import { UsuariosRepository, PrismaUsuariosRepository } from './repositories/usuarios.repository';

@Module({
  controllers: [UsuariosController],
  providers: [UsuariosService, { provide: UsuariosRepository, useClass: PrismaUsuariosRepository }],
})
export class UsuariosModule {}

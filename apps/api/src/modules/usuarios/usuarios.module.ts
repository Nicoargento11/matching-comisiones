import { Module } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { UsuariosController } from './usuarios.controller';
import { UsuariosRepository } from './repositories/usuarios.repository';

@Module({
  controllers: [UsuariosController],
  providers: [UsuariosService, UsuariosRepository],
})
export class UsuariosModule {}

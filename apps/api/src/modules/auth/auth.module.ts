import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthRepository, PrismaAuthRepository } from './repositories/auth.repository';

@Module({
  controllers: [AuthController],
  providers: [AuthService, { provide: AuthRepository, useClass: PrismaAuthRepository }],
  exports: [AuthService],
})
export class AuthModule {}

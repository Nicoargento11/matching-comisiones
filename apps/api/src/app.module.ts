import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { AuthGuard } from './common/guards/auth/auth.guard';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { ComisionesModule } from './modules/comisiones/comisiones.module';
import { AcademicoModule } from './modules/academico/academico.module';
import { IntercambiosModule } from './modules/intercambios/intercambios.module';
import { NotificacionesModule } from './modules/notificaciones/notificaciones.module';
import { ProfesoresModule } from './modules/profesores/profesores.module';
import { MensajesModule } from './modules/mensajes/mensajes.module';
import { validationSchema } from './config/validation.schema';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validationSchema }),
    HealthModule,
    PrismaModule,
    AuthModule,
    UsuariosModule,
    ComisionesModule,
    AcademicoModule,
    IntercambiosModule,
    NotificacionesModule,
    ProfesoresModule,
    MensajesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AppModule {}

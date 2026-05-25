import { Logger, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { AuthGuard } from './common/guards/auth/auth.guard';
import { RolesGuard } from './common/guards/roles/roles.guard';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { ComisionesModule } from './modules/comisiones/comisiones.module';
import { ProfesoresModule } from './modules/profesores/profesores.module';
import { MensajesModule } from './modules/mensajes/mensajes.module';
import { NotificacionesModule } from './modules/notificaciones/notificaciones.module';
import { IntercambiosModule } from './modules/intercambios/intercambios.module';
import { validationSchema } from './config/validation.schema';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validationSchema }),
    HealthModule,
    PrismaModule,
    AuthModule,
    UsuariosModule,
    ComisionesModule,
    ProfesoresModule,
    MensajesModule,
    NotificacionesModule,
    IntercambiosModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    Logger,
    // Orden importa: primero autentica (AuthGuard), luego autoriza (RolesGuard)
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}

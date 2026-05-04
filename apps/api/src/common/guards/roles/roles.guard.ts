import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ComisionesService } from '../../../modules/comisiones/comisiones.service';
import { ROLES_KEY } from '../../decorators/roles.decorator';
import type { CurrentUserClaims } from '../../decorators/current-user.decorator';
import type { Request } from 'express';

/**
 * Guard global que verifica roles requeridos por endpoint.
 *
 * Flujo:
 * 1. Si no hay @Roles → cualquier usuario autenticado pasa (AuthGuard ya validó JWT)
 * 2. Si hay @Roles → compara el claim `role` del JWT contra los roles requeridos
 * 3. Si el rol es 'profesor' y el endpoint opera sobre una comisión (parámetro :id_comision),
 *    verifica que el usuario sea el profesor asignado a ESA comisión (CO-01/CO-02)
 *
 * Confía en JWT `role` claim para verificación genérica (no consulta DB por roles).
 * Solo consulta DB para verificación profesor-comisión cuando hace falta.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(forwardRef(() => ComisionesService))
    private readonly comisionesService: ComisionesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Sin @Roles → cualquier autenticado pasa
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: CurrentUserClaims = request['user'];

    if (!user) {
      throw new ForbiddenException(
        'No se encontró información de usuario en el token',
      );
    }

    // Verificar rol genérico contra JWT claim
    const userRole = user.role;
    if (!userRole || !requiredRoles.includes(userRole)) {
      throw new ForbiddenException(
        `Rol requerido: ${requiredRoles.join(', ')}. Rol actual: ${userRole ?? 'ninguno'}`,
      );
    }

    // Verificación profesor-comisión (CO-01/CO-02)
    // Solo si el rol es profesor y el endpoint tiene :id_comision en los parámetros
    if (userRole === 'profesor') {
      const idComision = this.extraerIdComision(request);
      if (idComision !== null) {
        await this.comisionesService.verificarProfesorDeComision(
          user.sub,
          idComision,
        );
      }
    }

    return true;
  }

  /**
   * Extrae el id_comision de los parámetros de la request
   * @param request - Request de Express
   * @returns ID de la comisión, o null si no está presente
   */
  private extraerIdComision(request: Request): number | null {
    const rawId = request.params?.id_comision;
    if (typeof rawId !== 'string') return null;
    const parsed = parseInt(rawId, 10);
    return isNaN(parsed) ? null : parsed;
  }
}

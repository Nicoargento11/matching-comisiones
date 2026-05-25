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
 * 2. Si hay @Roles → verifica contra user.roles (array resuelto desde DB por AuthGuard)
 * 3. Si el usuario tiene rol 'profesor' y el endpoint tiene :id_comision,
 *    verifica que sea el profesor asignado a ESA comisión (CO-01/CO-02)
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

    // Verificar roles contra los obtenidos de la DB (adjuntados por AuthGuard)
    const userRoles: string[] = user.roles ?? [];
    if (!requiredRoles.some((r) => userRoles.includes(r))) {
      throw new ForbiddenException(
        `Rol requerido: ${requiredRoles.join(', ')}. Rol actual: ${userRoles.join(', ') || 'ninguno'}`,
      );
    }

    // Verificación profesor-comisión (CO-01/CO-02)
    // Solo si el rol es profesor y el endpoint tiene :id_comision en los parámetros
    if (userRoles.includes('profesor')) {
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

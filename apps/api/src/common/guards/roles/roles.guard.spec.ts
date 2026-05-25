import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ForbiddenException } from '@nestjs/common';
import { ForbiddenError } from '../../errors/business-error';
import { ComisionesService } from '../../../modules/comisiones/comisiones.service';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;
  let comisionesService: jest.Mocked<
    Pick<ComisionesService, 'verificarProfesorDeComision'>
  >;

  const mockExecutionContext: any = (user: any, params: any = {}) => ({
    switchToHttp: () => ({
      getRequest: () => ({
        user,
        params,
      }),
    }),
    getHandler: () => jest.fn(),
    getClass: () => jest.fn(),
  });

  beforeEach(() => {
    reflector = new Reflector();
    comisionesService = {
      verificarProfesorDeComision: jest.fn().mockResolvedValue(undefined),
    };
    guard = new RolesGuard(
      reflector,
      comisionesService as unknown as ComisionesService,
    );
  });

  describe('sin @Roles', () => {
    it('debe permitir acceso si no hay roles requeridos', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const ctx = mockExecutionContext({ sub: 'auth-1', roles: ['estudiante'] });
      const result = await guard.canActivate(ctx);

      expect(result).toBe(true);
    });
  });

  describe('con @Roles', () => {
    it('debe permitir acceso si el rol coincide', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['profesor']);

      const ctx = mockExecutionContext({ sub: 'auth-1', roles: ['profesor'] });
      const result = await guard.canActivate(ctx);

      expect(result).toBe(true);
    });

    it('debe lanzar ForbiddenException si el rol no coincide', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);

      const ctx = mockExecutionContext({ sub: 'auth-1', roles: ['estudiante'] });

      await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    });

    it('debe lanzar ForbiddenException si no hay roles en el token', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);

      const ctx = mockExecutionContext({ sub: 'auth-1', roles: [] });

      await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('verificación profesor-comisión (CO-01/CO-02)', () => {
    it('debe permitir acceso si verificarProfesorDeComision no lanza excepción', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['profesor']);
      comisionesService.verificarProfesorDeComision.mockResolvedValue(
        undefined,
      );

      const ctx = mockExecutionContext(
        { sub: 'auth-1', roles: ['profesor'] },
        { id_comision: '1' },
      );
      const result = await guard.canActivate(ctx);

      expect(result).toBe(true);
      expect(
        comisionesService.verificarProfesorDeComision,
      ).toHaveBeenCalledWith('auth-1', 1);
    });

    it('debe propagar ForbiddenError si el profesor NO es el asignado', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['profesor']);
      comisionesService.verificarProfesorDeComision.mockRejectedValue(
        new ForbiddenError(
          'COMISION_SIN_PROFESOR',
          'Solo el profesor asignado a esta comisión puede realizar esta operación',
        ),
      );

      const ctx = mockExecutionContext(
        { sub: 'auth-1', roles: ['profesor'] },
        { id_comision: '1' },
      );

      await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    });

    it('no debe llamar a verificarProfesorDeComision si no hay id_comision en params', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['profesor']);

      const ctx = mockExecutionContext({ sub: 'auth-1', roles: ['profesor'] }, {});
      await guard.canActivate(ctx);

      expect(
        comisionesService.verificarProfesorDeComision,
      ).not.toHaveBeenCalled();
    });

    it('no debe verificar profesor-comisión si el rol no es profesor', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);

      const ctx = mockExecutionContext(
        { sub: 'auth-1', roles: ['admin'] },
        { id_comision: '1' },
      );
      const result = await guard.canActivate(ctx);

      expect(result).toBe(true);
      expect(
        comisionesService.verificarProfesorDeComision,
      ).not.toHaveBeenCalled();
    });
  });
});

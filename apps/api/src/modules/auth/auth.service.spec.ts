import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthRepository } from './repositories/auth.repository';

describe('AuthService', () => {
  let service: AuthService;
  let repository: jest.Mocked<AuthRepository>;

  const mockUsuario = {
    id_usuario: 1,
    nombre_usuario: 'Juan',
    apellido_usuario: 'Pérez',
    correo: 'juan@test.com',
    activo: true,
    roles: [{ rol: { id_rol: 1, nombre_rol: 'estudiante' } }],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: AuthRepository,
          useValue: {
            obtenerPorAuthId: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    repository = module.get(AuthRepository);
  });

  describe('obtenerMe', () => {
    it('debe retornar los datos del usuario con roles aplanados', async () => {
      repository.obtenerPorAuthId.mockResolvedValue(mockUsuario as any);

      const result = await service.obtenerMe('auth-123');

      expect(repository.obtenerPorAuthId).toHaveBeenCalledWith('auth-123');
      expect(result).toEqual({
        ...mockUsuario,
        roles: [{ id_rol: 1, nombre_rol: 'estudiante' }],
      });
    });

    it('debe lanzar NotFoundException cuando no existe el usuario', async () => {
      repository.obtenerPorAuthId.mockResolvedValue(null);

      await expect(service.obtenerMe('auth-unknown')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.obtenerMe('auth-unknown')).rejects.toThrow(
        'Usuario no encontrado. ¿Está vinculado el supabase_auth_id?',
      );
    });
  });
});

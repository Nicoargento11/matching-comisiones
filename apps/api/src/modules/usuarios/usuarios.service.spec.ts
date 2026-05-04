import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { UsuariosRepository } from './repositories/usuarios.repository';
import { PaginacionDto } from '../../common/dto/paginacion.dto';

describe('UsuariosService', () => {
  let service: UsuariosService;
  let repository: jest.Mocked<UsuariosRepository>;

  const mockUsuario = {
    id_usuario: 1,
    dni: 12345678,
    nombre_usuario: 'Juan',
    apellido_usuario: 'Pérez',
    correo: 'juan@test.com',
    activo: true,
    fecha_registro: new Date(),
    roles: [{ rol: { nombre_rol: 'estudiante' } }],
  };

  const mockUsuarioSinRoles = {
    id_usuario: 1,
    dni: 12345678,
    nombre_usuario: 'Juan',
    apellido_usuario: 'Pérez',
    correo: 'juan@test.com',
    activo: true,
    fecha_registro: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsuariosService,
        {
          provide: UsuariosRepository,
          useValue: {
            obtenerPorId: jest.fn(),
            obtenerPorDni: jest.fn(),
            obtenerTodos: jest.fn(),
            contar: jest.fn(),
            verificarExistencia: jest.fn(),
            obtenerPrimerEstudianteUsuarioId: jest.fn(),
            obtenerPrimerProfesorUsuarioId: jest.fn(),
            obtenerComisionesDeEstudiante: jest.fn(),
            obtenerConversaciones: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsuariosService>(UsuariosService);
    repository = module.get(UsuariosRepository);
  });

  describe('obtenerEstudiante', () => {
    it('debe retornar el usuario cuando existe', async () => {
      repository.obtenerPorId.mockResolvedValue(mockUsuario as any);

      const result = await service.obtenerEstudiante(1);

      expect(repository.obtenerPorId).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockUsuario);
    });

    it('debe lanzar NotFoundException cuando no existe', async () => {
      repository.obtenerPorId.mockResolvedValue(null);

      await expect(service.obtenerEstudiante(999)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.obtenerEstudiante(999)).rejects.toThrow(
        'No existe usuario con id_usuario=999',
      );
    });
  });

  describe('obtenerPorDni', () => {
    it('debe retornar el usuario por DNI', async () => {
      repository.obtenerPorDni.mockResolvedValue(mockUsuario as any);

      const result = await service.obtenerPorDni(12345678);

      expect(repository.obtenerPorDni).toHaveBeenCalledWith(12345678);
      expect(result).toEqual(mockUsuario);
    });

    it('debe lanzar NotFoundException cuando no existe', async () => {
      repository.obtenerPorDni.mockResolvedValue(null);

      await expect(service.obtenerPorDni(99999999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debe lanzar BadRequestException cuando el DNI tiene menos de 7 dígitos', async () => {
      await expect(service.obtenerPorDni(999)).rejects.toThrow(
        BadRequestException,
      );
      expect(repository.obtenerPorDni).not.toHaveBeenCalled();
    });
  });

  describe('obtenerEstudiantes', () => {
    it('debe retornar lista paginada con meta', async () => {
      const paginacionDto = new PaginacionDto();
      const usuarios = [mockUsuarioSinRoles] as any[];
      repository.obtenerTodos.mockResolvedValue(usuarios);
      repository.contar.mockResolvedValue(1);

      const result = await service.obtenerEstudiantes(paginacionDto);

      expect(result).toEqual({
        data: usuarios,
        meta: {
          total: 1,
          pagina: 1,
          limite: 10,
          totalPaginas: 1,
        },
      });
      expect(repository.obtenerTodos).toHaveBeenCalled();
      expect(repository.contar).toHaveBeenCalled();
    });
  });

  describe('obtenerComisionesDeEstudiante', () => {
    it('debe retornar comisiones cuando el estudiante existe', async () => {
      repository.verificarExistencia.mockResolvedValue({
        id_usuario: 1,
      } as any);
      repository.obtenerComisionesDeEstudiante.mockResolvedValue([]);

      const result = await service.obtenerComisionesDeEstudiante(1);

      expect(repository.verificarExistencia).toHaveBeenCalledWith(1);
      expect(repository.obtenerComisionesDeEstudiante).toHaveBeenCalledWith(1);
      expect(result).toEqual([]);
    });

    it('debe lanzar NotFoundException cuando el estudiante no existe', async () => {
      repository.verificarExistencia.mockResolvedValue(null);

      await expect(service.obtenerComisionesDeEstudiante(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

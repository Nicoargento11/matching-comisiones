import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
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
    roles: [{ rol: { id_rol: 1, nombre_rol: 'estudiante' } }],
  };

  const mockUsuarioAplanado = {
    ...mockUsuario,
    roles: [{ id_rol: 1, nombre_rol: 'estudiante' }],
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
            buscarPorNombre: jest.fn(),
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
      expect(result).toEqual(mockUsuarioAplanado);
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
      expect(result).toEqual(mockUsuarioAplanado);
    });

    it('debe lanzar NotFoundException cuando no existe', async () => {
      repository.obtenerPorDni.mockResolvedValue(null);

      await expect(service.obtenerPorDni(99999999)).rejects.toThrow(
        NotFoundException,
      );
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

  describe('obtenerPrimerEstudianteUsuarioId', () => {
    it('debe retornar el id cuando hay estudiantes', async () => {
      repository.obtenerPrimerEstudianteUsuarioId.mockResolvedValue(42);

      const result = await service.obtenerPrimerEstudianteUsuarioId();

      expect(repository.obtenerPrimerEstudianteUsuarioId).toHaveBeenCalled();
      expect(result).toBe(42);
    });

    it('debe lanzar NotFoundException cuando no hay estudiantes', async () => {
      repository.obtenerPrimerEstudianteUsuarioId.mockResolvedValue(null);

      await expect(service.obtenerPrimerEstudianteUsuarioId()).rejects.toThrow(NotFoundException);
    });
  });

  describe('obtenerPrimerProfesorUsuarioId', () => {
    it('debe retornar el id cuando hay profesores', async () => {
      repository.obtenerPrimerProfesorUsuarioId.mockResolvedValue(10);

      const result = await service.obtenerPrimerProfesorUsuarioId();

      expect(repository.obtenerPrimerProfesorUsuarioId).toHaveBeenCalled();
      expect(result).toBe(10);
    });

    it('debe lanzar NotFoundException cuando no hay profesores', async () => {
      repository.obtenerPrimerProfesorUsuarioId.mockResolvedValue(null);

      await expect(service.obtenerPrimerProfesorUsuarioId()).rejects.toThrow(NotFoundException);
    });
  });

  describe('buscar', () => {
    it('debe retornar usuarios con roles aplanados', async () => {
      repository.buscarPorNombre.mockResolvedValue([mockUsuario] as any);

      const result = await service.buscar('Juan', 99);

      expect(repository.buscarPorNombre).toHaveBeenCalledWith('Juan', 99, undefined);
      expect(result).toEqual([mockUsuarioAplanado]);
    });

    it('debe pasar el idComision al repositorio cuando se provee', async () => {
      repository.buscarPorNombre.mockResolvedValue([]);

      await service.buscar('Ana', 99, 5);

      expect(repository.buscarPorNombre).toHaveBeenCalledWith('Ana', 99, 5);
    });

    it('debe retornar array vacío cuando no hay coincidencias', async () => {
      repository.buscarPorNombre.mockResolvedValue([]);

      const result = await service.buscar('xyzxyz', 1);

      expect(result).toEqual([]);
    });
  });

  describe('obtenerConversaciones', () => {
    it('debe retornar las conversaciones cuando el usuario existe', async () => {
      repository.verificarExistencia.mockResolvedValue({ id_usuario: 1 } as any);
      repository.obtenerConversaciones.mockResolvedValue([{ id_conversacion: 1 }] as any);

      const result = await service.obtenerConversaciones(1);

      expect(repository.verificarExistencia).toHaveBeenCalledWith(1);
      expect(repository.obtenerConversaciones).toHaveBeenCalledWith(1);
      expect(result).toEqual([{ id_conversacion: 1 }]);
    });

    it('debe lanzar NotFoundException cuando el usuario no existe', async () => {
      repository.verificarExistencia.mockResolvedValue(null);

      await expect(service.obtenerConversaciones(999)).rejects.toThrow(NotFoundException);
    });
  });
});

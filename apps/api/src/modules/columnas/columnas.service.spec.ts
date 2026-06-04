import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ColumnasService } from './columnas.service';
import { ColumnasRepository } from './repositories/columnas.repository';

const mockColumnaRaw = {
  id_columna: 10,
  nombre: 'Mi columna',
  orden_columna: 4,
  id_usuario: 1,
};

describe('ColumnasService', () => {
  let service: ColumnasService;
  let repository: jest.Mocked<ColumnasRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ColumnasService,
        {
          provide: ColumnasRepository,
          useValue: {
            obtenerParaUsuario: jest.fn(),
            obtenerGlobalPorNombre: jest.fn(),
            obtenerUsuarioPorNombre: jest.fn(),
            maxOrdenUsuario: jest.fn(),
            crear: jest.fn(),
            eliminar: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ColumnasService>(ColumnasService);
    repository = module.get(ColumnasRepository);
  });

  describe('obtenerParaUsuario', () => {
    it('debe retornar las columnas del usuario con el campo es_global calculado', async () => {
      // columna global: id_usuario null; columna personal: id_usuario = 1
      repository.obtenerParaUsuario.mockResolvedValue([
        { ...mockColumnaRaw, id_usuario: null },
        { ...mockColumnaRaw, id_columna: 11, id_usuario: 1 },
      ] as any);

      const result = await service.obtenerParaUsuario(1);

      expect(repository.obtenerParaUsuario).toHaveBeenCalledWith(1);
      expect(result).toHaveLength(2);
    });

    it('debe retornar array vacío cuando no hay columnas', async () => {
      repository.obtenerParaUsuario.mockResolvedValue([]);

      const result = await service.obtenerParaUsuario(1);

      expect(result).toEqual([]);
    });
  });

  describe('crear', () => {
    it('debe crear la columna con orden correcto cuando no hay conflictos', async () => {
      repository.obtenerGlobalPorNombre.mockResolvedValue(null);
      repository.obtenerUsuarioPorNombre.mockResolvedValue(null);
      repository.maxOrdenUsuario.mockResolvedValue(3);
      repository.crear.mockResolvedValue(mockColumnaRaw as any);

      await service.crear(1, { nombre: 'Mi columna' } as any);

      // orden debe ser max(3, 3) + 1 = 4
      expect(repository.crear).toHaveBeenCalledWith(1, 'Mi columna', 4);
    });

    it('debe lanzar BadRequestException si el nombre colisiona con una columna global', async () => {
      repository.obtenerGlobalPorNombre.mockResolvedValue({
        id_columna: 1,
        nombre: 'Por hacer',
      } as any);

      await expect(service.crear(1, { nombre: 'Por hacer' } as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debe lanzar BadRequestException si el usuario ya tiene una columna con ese nombre', async () => {
      repository.obtenerGlobalPorNombre.mockResolvedValue(null);
      repository.obtenerUsuarioPorNombre.mockResolvedValue({
        id_columna: 5,
        nombre: 'Revisión',
      } as any);

      await expect(service.crear(1, { nombre: 'Revisión' } as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('el orden no puede ser menor que 4 (mínimo 3 + 1)', async () => {
      repository.obtenerGlobalPorNombre.mockResolvedValue(null);
      repository.obtenerUsuarioPorNombre.mockResolvedValue(null);
      repository.maxOrdenUsuario.mockResolvedValue(0); // maxOrden = 0, Math.max(0,3) = 3, orden = 4
      repository.crear.mockResolvedValue(mockColumnaRaw as any);

      await service.crear(1, { nombre: 'Nueva' } as any);

      expect(repository.crear).toHaveBeenCalledWith(1, 'Nueva', 4);
    });
  });

  describe('eliminar', () => {
    it('debe eliminar la columna cuando el usuario es el dueño', async () => {
      repository.eliminar.mockResolvedValue({ count: 1 } as any);

      await service.eliminar(10, 1);

      expect(repository.eliminar).toHaveBeenCalledWith(10, 1);
    });

    it('debe lanzar ForbiddenException cuando el usuario no es el dueño o la columna no existe', async () => {
      repository.eliminar.mockResolvedValue({ count: 0 } as any);

      await expect(service.eliminar(99, 1)).rejects.toThrow(ForbiddenException);
    });
  });
});

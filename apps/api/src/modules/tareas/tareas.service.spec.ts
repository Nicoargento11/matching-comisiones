import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { TareasService } from './tareas.service';
import { TareasRepository } from './repositories/tareas.repository';

const mockTareaRaw = {
  id_tarea: 1,
  titulo: 'Tarea de prueba',
  descripcion: null,
  prioridad: 'MEDIA',
  estimacion_min: null,
  fecha_vencimiento: null,
  columna: { nombre: 'Por hacer' },
  materia: null,
  evento: null,
};

describe('TareasService', () => {
  let service: TareasService;
  let repository: jest.Mocked<TareasRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TareasService,
        {
          provide: TareasRepository,
          useValue: {
            obtenerPorUsuario: jest.fn(),
            obtenerColumnaPorNombre: jest.fn(),
            crear: jest.fn(),
            actualizarEstado: jest.fn(),
            obtenerPorId: jest.fn(),
            eliminar: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TareasService>(TareasService);
    repository = module.get(TareasRepository);
  });

  describe('obtenerPorUsuario', () => {
    it('debe retornar la lista de tareas del usuario', async () => {
      repository.obtenerPorUsuario.mockResolvedValue([mockTareaRaw] as any);

      const result = await service.obtenerPorUsuario(1);

      expect(repository.obtenerPorUsuario).toHaveBeenCalledWith(1);
      expect(result).toHaveLength(1);
    });

    it('debe retornar array vacío cuando el usuario no tiene tareas', async () => {
      repository.obtenerPorUsuario.mockResolvedValue([]);

      const result = await service.obtenerPorUsuario(1);

      expect(result).toEqual([]);
    });
  });

  describe('crear', () => {
    const mockColumna = { id_columna: 1, nombre: 'Por hacer' };

    it('debe crear una tarea cuando la columna existe', async () => {
      repository.obtenerColumnaPorNombre.mockResolvedValue(mockColumna as any);
      repository.crear.mockResolvedValue(mockTareaRaw as any);

      await service.crear(1, {
        titulo: 'Nueva tarea',
        prioridad: 'MEDIA',
        estado: 'POR_HACER',
      } as any);

      expect(repository.obtenerColumnaPorNombre).toHaveBeenCalledWith('Por hacer', 1);
      expect(repository.crear).toHaveBeenCalled();
    });

    it('debe lanzar BadRequestException cuando la columna no existe', async () => {
      repository.obtenerColumnaPorNombre.mockResolvedValue(null);

      await expect(
        service.crear(1, { titulo: 'Tarea', prioridad: 'ALTA', estado: 'POR_HACER' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe usar el nombre de columna del mapper ESTADO_A_COLUMNA', async () => {
      repository.obtenerColumnaPorNombre.mockResolvedValue(mockColumna as any);
      repository.crear.mockResolvedValue(mockTareaRaw as any);

      await service.crear(1, { titulo: 'T', prioridad: 'BAJA', estado: 'EN_PROGRESO' } as any);

      // EN_PROGRESO → 'En progreso'
      expect(repository.obtenerColumnaPorNombre).toHaveBeenCalledWith('En progreso', 1);
    });
  });

  describe('actualizarEstado', () => {
    it('debe lanzar BadRequestException cuando la columna de destino no existe', async () => {
      repository.obtenerColumnaPorNombre.mockResolvedValue(null);

      await expect(service.actualizarEstado(1, 'POR_HACER', 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debe lanzar ForbiddenException cuando el usuario no es dueño de la tarea', async () => {
      repository.obtenerColumnaPorNombre.mockResolvedValue({ id_columna: 2 } as any);
      repository.actualizarEstado.mockResolvedValue({ count: 0 } as any);

      await expect(service.actualizarEstado(1, 'EN_PROGRESO', 99)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('debe actualizar el estado y retornar la tarea actualizada', async () => {
      repository.obtenerColumnaPorNombre.mockResolvedValue({ id_columna: 2 } as any);
      repository.actualizarEstado.mockResolvedValue({ count: 1 } as any);
      repository.obtenerPorId.mockResolvedValue({
        ...mockTareaRaw,
        columna: { nombre: 'En progreso' },
      } as any);

      await service.actualizarEstado(1, 'EN_PROGRESO', 1);

      expect(repository.actualizarEstado).toHaveBeenCalledWith(1, 1, 2);
      expect(repository.obtenerPorId).toHaveBeenCalledWith(1);
    });
  });

  describe('eliminar', () => {
    it('debe eliminar la tarea cuando el usuario es el dueño', async () => {
      repository.eliminar.mockResolvedValue({ count: 1 } as any);

      await service.eliminar(1, 1);

      expect(repository.eliminar).toHaveBeenCalledWith(1, 1);
    });

    it('debe lanzar ForbiddenException cuando el usuario no es el dueño', async () => {
      repository.eliminar.mockResolvedValue({ count: 0 } as any);

      await expect(service.eliminar(1, 99)).rejects.toThrow(ForbiddenException);
    });
  });
});

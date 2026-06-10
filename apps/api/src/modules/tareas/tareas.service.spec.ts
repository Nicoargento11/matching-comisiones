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
            crearTarea: jest.fn(),
            moverAColumna: jest.fn(),
            obtenerPorId: jest.fn(),
            eliminarTarea: jest.fn(),
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

  describe('crearTarea', () => {
    const mockColumna = { id_columna: 1, nombre: 'Por hacer' };

    it('debe crear una tarea cuando la columna existe', async () => {
      repository.obtenerColumnaPorNombre.mockResolvedValue(mockColumna as any);
      repository.crearTarea.mockResolvedValue(mockTareaRaw as any);

      await service.crearTarea(1, {
        titulo: 'Nueva tarea',
        prioridad: 'MEDIA',
        estado: 'POR_HACER',
      } as any);

      expect(repository.obtenerColumnaPorNombre).toHaveBeenCalledWith('Por hacer', 1);
      expect(repository.crearTarea).toHaveBeenCalled();
    });

    it('debe lanzar BadRequestException cuando la columna no existe', async () => {
      repository.obtenerColumnaPorNombre.mockResolvedValue(null);

      await expect(
        service.crearTarea(1, { titulo: 'Tarea', prioridad: 'ALTA', estado: 'POR_HACER' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe usar el nombre de columna del mapper ESTADO_A_COLUMNA', async () => {
      repository.obtenerColumnaPorNombre.mockResolvedValue(mockColumna as any);
      repository.crearTarea.mockResolvedValue(mockTareaRaw as any);

      await service.crearTarea(1, { titulo: 'T', prioridad: 'BAJA', estado: 'EN_PROGRESO' } as any);

      // EN_PROGRESO → 'En progreso'
      expect(repository.obtenerColumnaPorNombre).toHaveBeenCalledWith('En progreso', 1);
    });

    it('usa el estado directamente como nombre cuando no está en el mapa', async () => {
      repository.obtenerColumnaPorNombre.mockResolvedValue(mockColumna as any);
      repository.crearTarea.mockResolvedValue(mockTareaRaw as any);

      await service.crearTarea(1, { titulo: 'T', prioridad: 'MEDIA', estado: 'CUSTOM' } as any);

      expect(repository.obtenerColumnaPorNombre).toHaveBeenCalledWith('CUSTOM', 1);
    });

    it('pasa fecha_vencimiento como Date cuando se provee', async () => {
      repository.obtenerColumnaPorNombre.mockResolvedValue(mockColumna as any);
      repository.crearTarea.mockResolvedValue(mockTareaRaw as any);

      await service.crearTarea(1, {
        titulo: 'T',
        prioridad: 'MEDIA',
        estado: 'POR_HACER',
        fecha_vencimiento: '2026-12-31',
      } as any);

      expect(repository.crearTarea).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ fecha_vencimiento: new Date('2026-12-31') }),
      );
    });
  });

  describe('moverAColumna', () => {
    it('debe lanzar BadRequestException cuando la columna de destino no existe', async () => {
      repository.obtenerColumnaPorNombre.mockResolvedValue(null);

      await expect(service.moverAColumna(1, 'POR_HACER', 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debe lanzar ForbiddenException cuando el usuario no es dueño de la tarea', async () => {
      repository.obtenerColumnaPorNombre.mockResolvedValue({ id_columna: 2 } as any);
      repository.moverAColumna.mockResolvedValue({ count: 0 } as any);

      await expect(service.moverAColumna(1, 'EN_PROGRESO', 99)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('usa el estado directamente cuando no está en el mapa', async () => {
      repository.obtenerColumnaPorNombre.mockResolvedValue(null);

      await expect(service.moverAColumna(1, 'COLUMNA_CUSTOM', 1)).rejects.toThrow(
        BadRequestException,
      );
      expect(repository.obtenerColumnaPorNombre).toHaveBeenCalledWith('COLUMNA_CUSTOM', 1);
    });

    it('debe actualizar el estado y retornar la tarea actualizada', async () => {
      repository.obtenerColumnaPorNombre.mockResolvedValue({ id_columna: 2 } as any);
      repository.moverAColumna.mockResolvedValue({ count: 1 } as any);
      repository.obtenerPorId.mockResolvedValue({
        ...mockTareaRaw,
        columna: { nombre: 'En progreso' },
      } as any);

      await service.moverAColumna(1, 'EN_PROGRESO', 1);

      expect(repository.moverAColumna).toHaveBeenCalledWith(1, 1, 2);
      expect(repository.obtenerPorId).toHaveBeenCalledWith(1);
    });
  });

  describe('eliminar', () => {
    it('debe eliminar la tarea cuando el usuario es el dueño', async () => {
      repository.eliminarTarea.mockResolvedValue({ count: 1 } as any);

      await service.eliminarTarea(1, 1);

      expect(repository.eliminarTarea).toHaveBeenCalledWith(1, 1);
    });

    it('debe lanzar ForbiddenException cuando el usuario no es el dueño', async () => {
      repository.eliminarTarea.mockResolvedValue({ count: 0 } as any);

      await expect(service.eliminarTarea(1, 99)).rejects.toThrow(ForbiddenException);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EstudiantesService } from './estudiantes.service';
import { EstudiantesRepository } from './repositories/estudiantes.repository';

describe('EstudiantesService', () => {
  let service: EstudiantesService;
  let repository: jest.Mocked<EstudiantesRepository>;

  const mockComision = {
    estado: 'ACTIVO',
    comision: {
      id_comision: 1,
      numero_comision: 1,
      nombre_comision: 'Comisión A',
      cupo_maximo: 30,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EstudiantesService,
        {
          provide: EstudiantesRepository,
          useValue: {
            verificarExistencia: jest.fn(),
            obtenerComisiones: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EstudiantesService>(EstudiantesService);
    repository = module.get(EstudiantesRepository);
  });

  describe('obtenerComisiones', () => {
    it('debe retornar las comisiones del estudiante', async () => {
      repository.verificarExistencia.mockResolvedValue({ id_usuario: 1 } as any);
      repository.obtenerComisiones.mockResolvedValue([mockComision] as any);

      const result = await service.obtenerComisiones(1);

      expect(repository.verificarExistencia).toHaveBeenCalledWith(1);
      expect(repository.obtenerComisiones).toHaveBeenCalledWith(1);
      expect(result).toEqual([mockComision]);
    });

    it('debe lanzar NotFoundException cuando el estudiante no existe', async () => {
      repository.verificarExistencia.mockResolvedValue(null);

      await expect(service.obtenerComisiones(999)).rejects.toThrow(NotFoundException);
    });
  });
});

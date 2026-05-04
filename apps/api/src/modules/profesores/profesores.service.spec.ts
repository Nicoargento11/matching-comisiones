import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProfesoresService } from './profesores.service';
import { ProfesoresRepository } from './repositories/profesores.repository';

describe('ProfesoresService', () => {
  let service: ProfesoresService;
  let repository: jest.Mocked<ProfesoresRepository>;

  const mockComision = {
    id_comision: 1,
    numero_comision: 1,
    nombre_comision: 'Comisión A',
    cupo_maximo: 30,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfesoresService,
        {
          provide: ProfesoresRepository,
          useValue: {
            verificarExistencia: jest.fn(),
            obtenerComisiones: jest.fn(),
            obtenerPrimeraComision: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProfesoresService>(ProfesoresService);
    repository = module.get(ProfesoresRepository);
  });

  describe('obtenerComisiones', () => {
    it('debe retornar las comisiones del profesor', async () => {
      repository.verificarExistencia.mockResolvedValue({
        id_usuario: 10,
      } as any);
      repository.obtenerComisiones.mockResolvedValue([mockComision] as any);

      const result = await service.obtenerComisiones(10);

      expect(repository.verificarExistencia).toHaveBeenCalledWith(10);
      expect(repository.obtenerComisiones).toHaveBeenCalledWith(10);
      expect(result).toEqual([mockComision]);
    });

    it('debe lanzar NotFoundException cuando no existe el usuario', async () => {
      repository.verificarExistencia.mockResolvedValue(null);

      await expect(service.obtenerComisiones(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('obtenerComision', () => {
    it('debe retornar la primera comisión del profesor', async () => {
      repository.verificarExistencia.mockResolvedValue({
        id_usuario: 10,
      } as any);
      repository.obtenerPrimeraComision.mockResolvedValue(mockComision as any);

      const result = await service.obtenerComision(10);

      expect(repository.obtenerPrimeraComision).toHaveBeenCalledWith(10);
      expect(result).toEqual(mockComision);
    });

    it('debe lanzar NotFoundException cuando no tiene comisión asignada', async () => {
      repository.verificarExistencia.mockResolvedValue({
        id_usuario: 10,
      } as any);
      repository.obtenerPrimeraComision.mockResolvedValue(null);

      await expect(service.obtenerComision(10)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.obtenerComision(10)).rejects.toThrow(
        'El profesor no tiene comisión asignada',
      );
    });
  });
});

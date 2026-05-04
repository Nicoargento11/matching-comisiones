import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ComisionesService } from './comisiones.service';
import { ComisionesRepository } from './repositories/comisiones.repository';
import { PaginacionDto } from '../../common/dto/paginacion.dto';

describe('ComisionesService', () => {
  let service: ComisionesService;
  let repository: jest.Mocked<ComisionesRepository>;

  const mockComision = {
    id_comision: 1,
    numero_comision: 1,
    nombre_comision: 'Comisión A',
    cupo_maximo: 30,
    materia: { id_materia: 1, nombre_materia: 'Matemática' },
    profesor: {
      id_usuario: 10,
      nombre_usuario: 'Prof',
      apellido_usuario: 'Test',
      correo: 'p@test.com',
    },
    horarios: [],
    usuarios: [],
    eventos: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComisionesService,
        {
          provide: ComisionesRepository,
          useValue: {
            obtenerTodas: jest.fn(),
            contar: jest.fn(),
            obtenerPorId: jest.fn(),
            verificarExistencia: jest.fn(),
            verificarExistenciaUsuario: jest.fn(),
            obtenerComisionesDeUsuario: jest.fn(),
            buscarInscripcion: jest.fn(),
            reactivarInscripcion: jest.fn(),
            crearInscripcion: jest.fn(),
            darBajaInscripcion: jest.fn(),
            buscarDiaPorNombre: jest.fn(),
            buscarModalidadPorNombre: jest.fn(),
            ejecutarTransaccion: jest.fn(),
            buscarHorario: jest.fn(),
            desactivarHorario: jest.fn(),
            reactivarHorario: jest.fn(),
            crearEvento: jest.fn(),
            buscarEvento: jest.fn(),
            modificarEvento: jest.fn(),
            desactivarEvento: jest.fn(),
            reactivarEvento: jest.fn(),
            verificarEsEstudiante: jest.fn(),
            obtenerHorariosActivosPorDia: jest.fn(),
            buscarInscripcionActivaEnMateria: jest.fn(),
            buscarComisionConProfesor: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ComisionesService>(ComisionesService);
    repository = module.get(ComisionesRepository);
  });

  describe('obtenerTodas', () => {
    it('debe retornar lista paginada con meta', async () => {
      const paginacionDto = new PaginacionDto();
      repository.obtenerTodas.mockResolvedValue([mockComision] as any);
      repository.contar.mockResolvedValue(1);

      const result = await service.obtenerTodas(paginacionDto);

      expect(result).toEqual({
        data: [mockComision],
        meta: { total: 1, pagina: 1, limite: 10, totalPaginas: 1 },
      });
    });
  });

  describe('obtenerDetalleComision', () => {
    it('debe retornar la comisión cuando existe', async () => {
      repository.obtenerPorId.mockResolvedValue(mockComision as any);

      const result = await service.obtenerDetalleComision(1);

      expect(repository.obtenerPorId).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockComision);
    });

    it('debe lanzar NotFoundException cuando no existe', async () => {
      repository.obtenerPorId.mockResolvedValue(null);

      await expect(service.obtenerDetalleComision(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('agregarEstudiante', () => {
    beforeEach(() => {
      repository.verificarExistencia.mockResolvedValue({
        id_comision: 1,
        id_materia: 1,
      } as any);
      repository.verificarEsEstudiante.mockResolvedValue({
        id_usuario: 5,
      } as any);
      repository.buscarInscripcionActivaEnMateria.mockResolvedValue(null);
    });

    it('debe crear inscripción cuando no existe inscripción previa', async () => {
      repository.buscarInscripcion.mockResolvedValue(null);
      repository.crearInscripcion.mockResolvedValue({
        id_usuario: 5,
        id_comision: 1,
        estado: 'ACTIVO',
      } as any);

      await service.agregarEstudiante(1, { id_usuario: 5 } as any);

      expect(repository.crearInscripcion).toHaveBeenCalledWith(5, 1);
    });

    it('debe lanzar ConflictException si el estudiante ya está activo', async () => {
      repository.buscarInscripcion.mockResolvedValue({
        estado: 'ACTIVO',
      } as any);

      await expect(
        service.agregarEstudiante(1, { id_usuario: 5 } as any),
      ).rejects.toThrow(ConflictException);
    });

    it('debe reactivar inscripción si existe pero está inactiva', async () => {
      repository.buscarInscripcion.mockResolvedValue({ estado: 'BAJA' } as any);
      repository.reactivarInscripcion.mockResolvedValue({
        id_usuario: 5,
        id_comision: 1,
        estado: 'ACTIVO',
      } as any);

      await service.agregarEstudiante(1, { id_usuario: 5 } as any);

      expect(repository.reactivarInscripcion).toHaveBeenCalledWith(5, 1);
    });
  });

  describe('agregarHorario', () => {
    const mockDia = { numero_dia: 1, nombre_dia: 'Lunes' };
    const mockModalidad = { id_modalidad: 1, nombre_modalidad: 'PRESENCIAL' };

    it('debe lanzar BadRequestException si hora_fin <= hora_inicio', async () => {
      repository.verificarExistencia.mockResolvedValue({
        id_comision: 1,
        id_materia: 1,
      } as any);

      await expect(
        service.agregarHorario(1, {
          hora_inicio: '10:00',
          hora_fin: '08:00',
          nombre_dia: 'Lunes',
          nombre_modalidad: 'PRESENCIAL',
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe lanzar ConflictException si hay solapamiento de horarios', async () => {
      repository.verificarExistencia.mockResolvedValue({
        id_comision: 1,
        id_materia: 1,
      } as any);
      repository.buscarDiaPorNombre.mockResolvedValue(mockDia as any);
      repository.buscarModalidadPorNombre.mockResolvedValue(
        mockModalidad as any,
      );
      repository.obtenerHorariosActivosPorDia.mockResolvedValue([
        { id_horario_comision: 10, hora_inicio: '09:00', hora_fin: '11:00' },
      ] as any);

      await expect(
        service.agregarHorario(1, {
          hora_inicio: '10:00',
          hora_fin: '12:00',
          nombre_dia: 'Lunes',
          nombre_modalidad: 'PRESENCIAL',
        } as any),
      ).rejects.toThrow(ConflictException);
    });

    it('debe crear horario cuando no hay solapamiento', async () => {
      repository.verificarExistencia.mockResolvedValue({
        id_comision: 1,
        id_materia: 1,
      } as any);
      repository.buscarDiaPorNombre.mockResolvedValue(mockDia as any);
      repository.buscarModalidadPorNombre.mockResolvedValue(
        mockModalidad as any,
      );
      repository.obtenerHorariosActivosPorDia.mockResolvedValue([]);
      repository.ejecutarTransaccion.mockResolvedValue({} as any);

      await service.agregarHorario(1, {
        hora_inicio: '14:00',
        hora_fin: '16:00',
        nombre_dia: 'Lunes',
        nombre_modalidad: 'PRESENCIAL',
      } as any);

      expect(repository.ejecutarTransaccion).toHaveBeenCalled();
    });
  });

  describe('agregarEvento', () => {
    it('debe lanzar BadRequestException si fecha_fin <= fecha_inicio', async () => {
      repository.verificarExistencia.mockResolvedValue({
        id_comision: 1,
        id_materia: 1,
      } as any);

      await expect(
        service.agregarEvento(1, {
          titulo: 'Parcial',
          fecha_inicio: '2026-06-20T10:00:00.000Z',
          fecha_fin: '2026-06-20T08:00:00.000Z',
        } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('agregarEstudiante — nuevas validaciones', () => {
    it('debe lanzar ForbiddenException si el usuario no tiene rol estudiante', async () => {
      repository.verificarExistencia.mockResolvedValue({
        id_comision: 1,
        id_materia: 1,
      } as any);
      repository.verificarEsEstudiante.mockResolvedValue(null);

      await expect(
        service.agregarEstudiante(1, { id_usuario: 99 } as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('debe lanzar ConflictException con COMISION_CONFLICTO_MATERIA si el alumno ya está en otra comisión de la misma materia', async () => {
      repository.verificarExistencia.mockResolvedValue({
        id_comision: 1,
        id_materia: 1,
      } as any);
      repository.verificarEsEstudiante.mockResolvedValue({
        id_usuario: 5,
      } as any);
      repository.buscarInscripcionActivaEnMateria.mockResolvedValue({
        id_comision: 2,
        comision: {
          id_comision: 2,
          numero_comision: 2,
          nombre_comision: 'Comisión B',
        },
      } as any);

      await expect(
        service.agregarEstudiante(1, { id_usuario: 5 } as any),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('trasladarEstudiante', () => {
    it('debe ejecutar baja en origen y alta en destino atómicamente', async () => {
      repository.verificarExistencia.mockResolvedValue({
        id_comision: 2,
        id_materia: 1,
      } as any);
      repository.buscarInscripcionActivaEnMateria.mockResolvedValue({
        id_comision: 1,
        comision: {
          id_comision: 1,
          numero_comision: 1,
          nombre_comision: 'Comisión A',
        },
      } as any);
      repository.ejecutarTransaccion.mockResolvedValue(undefined);

      await service.trasladarEstudiante(2, 5);

      expect(repository.ejecutarTransaccion).toHaveBeenCalled();
    });

    it('debe lanzar NotFoundException si el alumno no tiene inscripción activa en la materia', async () => {
      repository.verificarExistencia.mockResolvedValue({
        id_comision: 2,
        id_materia: 1,
      } as any);
      repository.buscarInscripcionActivaEnMateria.mockResolvedValue(null);

      await expect(service.trasladarEstudiante(2, 5)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('eliminarHorario', () => {
    it('debe lanzar NotFoundException si el horario no pertenece a la comisión', async () => {
      repository.buscarHorario.mockResolvedValue(null);

      await expect(service.eliminarHorario(1, 999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debe desactivar el horario cuando pertenece a la comisión', async () => {
      repository.buscarHorario.mockResolvedValue({
        id_horario_comision: 10,
      } as any);
      repository.desactivarHorario.mockResolvedValue(undefined);

      await service.eliminarHorario(1, 10);

      expect(repository.desactivarHorario).toHaveBeenCalledWith(10);
    });
  });
});

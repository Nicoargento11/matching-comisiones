// Importaciones necesarias del módulo de testing de NestJS y las excepciones HTTP que se verifican en los tests
import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
// Servicio bajo prueba y sus dependencias
import { ComisionesService } from './comisiones.service';
import { ComisionesRepository } from './repositories/comisiones.repository';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { PaginacionDto } from '../../common/dto/paginacion.dto';

describe('ComisionesService', () => {
  // Referencias tipadas al servicio y sus dependencias mockeadas
  let service: ComisionesService;
  let repository: jest.Mocked<ComisionesRepository>;
  let notificacionesService: jest.Mocked<NotificacionesService>;

  // Objeto base reutilizable que representa una comisión completa con todas sus relaciones
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

  // Se ejecuta antes de cada test: recrea el módulo completo con todas las dependencias mockeadas
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComisionesService,
        {
          // Mock del repositorio: todos los métodos son funciones jest vacías que se configuran por test
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
            buscarDatosAlumno: jest.fn(),
            upsertAula: jest.fn(),
            crearHorario: jest.fn(),
          },
        },
        {
          // Mock del servicio de notificaciones: crearNotificacion siempre resuelve sin error
          provide: NotificacionesService,
          useValue: { crearNotificacion: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    service = module.get<ComisionesService>(ComisionesService);
    repository = module.get(ComisionesRepository);
    notificacionesService = module.get(NotificacionesService);
  });

  // ─────────────────────────────────────────────
  // LISTADO PAGINADO DE COMISIONES
  // ─────────────────────────────────────────────
  describe('obtenerTodas', () => {
    it('debe retornar lista paginada con meta', async () => {
      const paginacionDto = new PaginacionDto();
      // Simula que el repositorio devuelve una comisión y un conteo de 1
      repository.obtenerTodas.mockResolvedValue([mockComision] as any);
      repository.contar.mockResolvedValue(1);

      const result = await service.obtenerTodas(paginacionDto);

      // Verifica que la respuesta incluya los datos y el objeto meta con paginación correcta
      expect(result).toEqual({
        data: [mockComision],
        meta: { total: 1, pagina: 1, limite: 10, totalPaginas: 1 },
      });
    });

    it('debe retornar lista vacía cuando no hay comisiones', async () => {
      const paginacionDto = new PaginacionDto();
      // Simula repositorio vacío
      repository.obtenerTodas.mockResolvedValue([]);
      repository.contar.mockResolvedValue(0);

      const result = await service.obtenerTodas(paginacionDto);

      // Cuando no hay datos, totalPaginas debe ser 0 (no 1)
      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPaginas).toBe(0);
    });
  });

  // ─────────────────────────────────────────────
  // DETALLE DE UNA COMISIÓN POR ID
  // ─────────────────────────────────────────────
  describe('obtenerDetalleComision', () => {
    it('debe retornar la comisión cuando existe', async () => {
      repository.obtenerPorId.mockResolvedValue(mockComision as any);

      const result = await service.obtenerDetalleComision(1);

      // Verifica que el repositorio fue llamado con el ID correcto
      expect(repository.obtenerPorId).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockComision);
    });

    it('debe lanzar NotFoundException cuando no existe', async () => {
      // null simula que la comisión no fue encontrada en la base de datos
      repository.obtenerPorId.mockResolvedValue(null);

      await expect(service.obtenerDetalleComision(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─────────────────────────────────────────────
  // INSCRIPCIÓN DE ESTUDIANTE A COMISIÓN
  // ─────────────────────────────────────────────
  describe('agregarEstudiante', () => {
    // Estado base compartido por los tres tests de este bloque:
    // comisión existe, el usuario tiene rol estudiante, y no está en ninguna otra comisión de la misma materia
    beforeEach(() => {
      repository.verificarExistencia.mockResolvedValue({
        id_comision: 1,
        id_materia: 1,
        numero_comision: 1,
        nombre_comision: 'Comisión A',
        materia: { nombre_materia: 'Matemática' },
        profesor: { id_usuario: 10, nombre_usuario: 'Prof', apellido_usuario: 'Test' },
      } as any);
      repository.verificarEsEstudiante.mockResolvedValue({
        id_usuario: 5,
      } as any);
      repository.buscarInscripcionActivaEnMateria.mockResolvedValue(null);
    });

    it('debe crear inscripción cuando no existe inscripción previa', async () => {
      // null = el alumno nunca estuvo inscripto en esta comisión
      repository.buscarInscripcion.mockResolvedValue(null);
      repository.crearInscripcion.mockResolvedValue({
        id_usuario: 5,
        id_comision: 1,
        estado: 'ACTIVO',
      } as any);

      await service.agregarEstudiante(1, { id_usuario: 5 } as any);

      // Se debe crear una inscripción nueva (no reactivar)
      expect(repository.crearInscripcion).toHaveBeenCalledWith(5, 1);
    });

    it('debe lanzar ConflictException si el estudiante ya está activo', async () => {
      // El alumno ya tiene una inscripción activa en esta comisión
      repository.buscarInscripcion.mockResolvedValue({
        estado: 'ACTIVO',
      } as any);

      await expect(
        service.agregarEstudiante(1, { id_usuario: 5 } as any),
      ).rejects.toThrow(ConflictException);
    });

    it('debe reactivar inscripción si existe pero está inactiva', async () => {
      // El alumno estuvo inscripto antes pero se dio de baja (estado BAJA)
      repository.buscarInscripcion.mockResolvedValue({ estado: 'BAJA' } as any);
      repository.reactivarInscripcion.mockResolvedValue({
        id_usuario: 5,
        id_comision: 1,
        estado: 'ACTIVO',
      } as any);

      await service.agregarEstudiante(1, { id_usuario: 5 } as any);

      // Se debe reactivar la inscripción existente, no crear una nueva
      expect(repository.reactivarInscripcion).toHaveBeenCalledWith(5, 1);
    });
  });

  // ─────────────────────────────────────────────
  // ALTA DE HORARIO EN UNA COMISIÓN
  // ─────────────────────────────────────────────
  describe('agregarHorario', () => {
    const mockDia = { numero_dia: 1, nombre_dia: 'Lunes' };
    const mockModalidad = { id_modalidad: 1, nombre_modalidad: 'PRESENCIAL' };

    it('debe lanzar BadRequestException si hora_fin <= hora_inicio', async () => {
      // La comisión existe pero el horario propuesto es inválido (fin antes que inicio)
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
      // Ya existe un horario de 09:00 a 11:00 — el nuevo (10:00-12:00) se solapa
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
      // No hay horarios existentes ese día: no puede haber solapamiento
      repository.obtenerHorariosActivosPorDia.mockResolvedValue([]);
      repository.ejecutarTransaccion.mockResolvedValue({} as any);

      await service.agregarHorario(1, {
        hora_inicio: '14:00',
        hora_fin: '16:00',
        nombre_dia: 'Lunes',
        nombre_modalidad: 'PRESENCIAL',
      } as any);

      // Se debe haber ejecutado la transacción para persistir el horario
      expect(repository.ejecutarTransaccion).toHaveBeenCalled();
    });

    it('debe crear horario cuando existen horarios en el día pero no se solapan', async () => {
      repository.verificarExistencia.mockResolvedValue({ id_comision: 1, id_materia: 1 } as any);
      repository.buscarDiaPorNombre.mockResolvedValue(mockDia as any);
      repository.buscarModalidadPorNombre.mockResolvedValue(mockModalidad as any);
      // Horario existente 09:00-11:00; el nuevo es 14:00-16:00 — no se solapan
      repository.obtenerHorariosActivosPorDia.mockResolvedValue([
        { id_horario_comision: 5, hora_inicio: '09:00', hora_fin: '11:00' },
      ] as any);
      repository.ejecutarTransaccion.mockResolvedValue({} as any);

      await service.agregarHorario(1, {
        hora_inicio: '14:00',
        hora_fin: '16:00',
        nombre_dia: 'Lunes',
        nombre_modalidad: 'PRESENCIAL',
      } as any);

      expect(repository.ejecutarTransaccion).toHaveBeenCalled();
    });

    it('debe lanzar NotFoundException si el día no existe', async () => {
      repository.verificarExistencia.mockResolvedValue({ id_comision: 1, id_materia: 1 } as any);
      // null = el nombre de día ingresado no existe en la tabla de días
      repository.buscarDiaPorNombre.mockResolvedValue(null);

      await expect(
        service.agregarHorario(1, {
          hora_inicio: '14:00',
          hora_fin: '16:00',
          nombre_dia: 'Inexistente',
          nombre_modalidad: 'PRESENCIAL',
        } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe crear horario sin aula cuando nombre_aula no se provee', async () => {
      repository.verificarExistencia.mockResolvedValue({ id_comision: 1, id_materia: 1 } as any);
      repository.buscarDiaPorNombre.mockResolvedValue(mockDia as any);
      repository.buscarModalidadPorNombre.mockResolvedValue(mockModalidad as any);
      repository.obtenerHorariosActivosPorDia.mockResolvedValue([]);
      repository.crearHorario.mockResolvedValue({ id_horario_comision: 1 } as any);
      // Simula que ejecutarTransaccion llama directamente a la función callback con un tx vacío
      repository.ejecutarTransaccion.mockImplementation(async (fn: any) => fn({}));

      await service.agregarHorario(1, {
        hora_inicio: '14:00',
        hora_fin: '16:00',
        nombre_dia: 'Lunes',
        nombre_modalidad: 'PRESENCIAL',
        // nombre_aula ausente
      } as any);

      // Sin aula, no debe haberse llamado upsertAula
      expect(repository.upsertAula).not.toHaveBeenCalled();
      // El horario se crea sin id_aula en los datos
      expect(repository.crearHorario).toHaveBeenCalledWith(
        {},
        expect.not.objectContaining({ id_aula: expect.anything() }),
      );
    });

    it('debe crear horario con aula cuando se provee nombre_aula', async () => {
      repository.verificarExistencia.mockResolvedValue({ id_comision: 1, id_materia: 1 } as any);
      repository.buscarDiaPorNombre.mockResolvedValue(mockDia as any);
      repository.buscarModalidadPorNombre.mockResolvedValue(mockModalidad as any);
      repository.obtenerHorariosActivosPorDia.mockResolvedValue([]);
      // upsertAula crea o actualiza el aula y devuelve su ID
      repository.upsertAula.mockResolvedValue({ id_aula: 5 } as any);
      repository.crearHorario.mockResolvedValue({ id_horario_comision: 1 } as any);
      repository.ejecutarTransaccion.mockImplementation(async (fn: any) => fn({}));

      await service.agregarHorario(1, {
        hora_inicio: '14:00',
        hora_fin: '16:00',
        nombre_dia: 'Lunes',
        nombre_modalidad: 'PRESENCIAL',
        nombre_aula: 'Aula 101',
      } as any);

      // El aula debe haberse creado/actualizado con el nombre provisto
      expect(repository.upsertAula).toHaveBeenCalledWith({}, 'Aula 101');
      // El horario se crea con el id_aula retornado por upsertAula
      expect(repository.crearHorario).toHaveBeenCalledWith(
        {},
        expect.objectContaining({ id_aula: 5 }),
      );
    });

    it('debe lanzar NotFoundException si la modalidad no existe', async () => {
      repository.verificarExistencia.mockResolvedValue({ id_comision: 1, id_materia: 1 } as any);
      repository.buscarDiaPorNombre.mockResolvedValue(mockDia as any);
      // null = la modalidad ingresada no existe en la tabla de modalidades
      repository.buscarModalidadPorNombre.mockResolvedValue(null);

      await expect(
        service.agregarHorario(1, {
          hora_inicio: '14:00',
          hora_fin: '16:00',
          nombre_dia: 'Lunes',
          nombre_modalidad: 'INEXISTENTE',
        } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─────────────────────────────────────────────
  // ALTA DE EVENTO EN UNA COMISIÓN
  // ─────────────────────────────────────────────
  describe('agregarEvento', () => {
    it('debe lanzar BadRequestException si fecha_fin <= fecha_inicio', async () => {
      repository.verificarExistencia.mockResolvedValue({
        id_comision: 1,
        id_materia: 1,
      } as any);

      // fecha_fin (08:00) es anterior a fecha_inicio (10:00) — inválido
      await expect(
        service.agregarEvento(1, {
          titulo: 'Parcial',
          fecha_inicio: '2026-06-20T10:00:00.000Z',
          fecha_fin: '2026-06-20T08:00:00.000Z',
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe crear el evento cuando las fechas son válidas', async () => {
      repository.verificarExistencia.mockResolvedValue({ id_comision: 1, id_materia: 1 } as any);
      repository.crearEvento.mockResolvedValue({ id_evento: 1, titulo: 'Parcial' } as any);

      const result = await service.agregarEvento(1, {
        titulo: 'Parcial',
        fecha_inicio: '2026-06-20T08:00:00.000Z',
        fecha_fin: '2026-06-20T10:00:00.000Z',
      } as any);

      // El servicio debe delegar la creación al repositorio con el id de comisión y los datos
      expect(repository.crearEvento).toHaveBeenCalledWith(1, expect.objectContaining({ titulo: 'Parcial' }));
      expect(result).toEqual({ id_evento: 1, titulo: 'Parcial' });
    });

    it('debe lanzar NotFoundException cuando la comisión no existe', async () => {
      repository.verificarExistencia.mockResolvedValue(null);

      await expect(
        service.agregarEvento(999, {
          titulo: 'Parcial',
          fecha_inicio: '2026-06-20T08:00:00.000Z',
          fecha_fin: '2026-06-20T10:00:00.000Z',
        } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─────────────────────────────────────────────
  // VALIDACIONES ADICIONALES DE INSCRIPCIÓN
  // (rol estudiante, conflicto de materia, fallbacks de nombre)
  // ─────────────────────────────────────────────
  describe('agregarEstudiante — nuevas validaciones', () => {
    it('debe lanzar ForbiddenException si el usuario no tiene rol estudiante', async () => {
      repository.verificarExistencia.mockResolvedValue({
        id_comision: 1,
        id_materia: 1,
      } as any);
      // null = el usuario existe pero no tiene rol de estudiante
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
      // El alumno ya tiene inscripción activa en Comisión B (id 2) para la misma materia
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

    it('usa el número de comisión como fallback en el mensaje de conflicto cuando nombre_comision es null', async () => {
      repository.verificarExistencia.mockResolvedValue({ id_comision: 1, id_materia: 1 } as any);
      repository.verificarEsEstudiante.mockResolvedValue({ id_usuario: 5 } as any);
      // La comisión conflictiva no tiene nombre, solo número — se usa "Comisión 2" como fallback
      repository.buscarInscripcionActivaEnMateria.mockResolvedValue({
        id_comision: 2,
        comision: { id_comision: 2, numero_comision: 2, nombre_comision: null },
      } as any);

      await expect(
        service.agregarEstudiante(1, { id_usuario: 5 } as any),
      ).rejects.toThrow(ConflictException);
    });

    it('usa fallback de nombre en notificación al reactivar cuando nombre_comision es null', async () => {
      // La comisión destino no tiene nombre — el mensaje de notificación debe usar "Comisión 1"
      repository.verificarExistencia.mockResolvedValue({
        id_comision: 1,
        id_materia: 1,
        numero_comision: 1,
        nombre_comision: null, // sin nombre
        materia: { nombre_materia: 'Matemática' },
        profesor: { id_usuario: 10, nombre_usuario: 'Prof', apellido_usuario: 'Test' },
      } as any);
      repository.verificarEsEstudiante.mockResolvedValue({ id_usuario: 5 } as any);
      repository.buscarInscripcionActivaEnMateria.mockResolvedValue(null);
      // La inscripción previa existe pero está dada de baja — se reactiva
      repository.buscarInscripcion.mockResolvedValue({ estado: 'BAJA' } as any);
      repository.reactivarInscripcion.mockResolvedValue({ id_usuario: 5, id_comision: 1, estado: 'ACTIVO' } as any);

      await service.agregarEstudiante(1, { id_usuario: 5 } as any);

      // La notificación debe mencionar "Comisión 1" como fallback al nombre null
      expect(notificacionesService.crearNotificacion).toHaveBeenCalledWith(
        expect.objectContaining({ mensaje: expect.stringContaining('Comisión 1') }),
      );
    });

    it('usa fallback de nombre en notificación al crear inscripción cuando nombre_comision es null', async () => {
      // Similar al anterior pero para el flujo de creación (no reactivación)
      repository.verificarExistencia.mockResolvedValue({
        id_comision: 1,
        id_materia: 1,
        numero_comision: 1,
        nombre_comision: null, // sin nombre
        materia: { nombre_materia: 'Matemática' },
        profesor: { id_usuario: 10, nombre_usuario: 'Prof', apellido_usuario: 'Test' },
      } as any);
      repository.verificarEsEstudiante.mockResolvedValue({ id_usuario: 5 } as any);
      repository.buscarInscripcionActivaEnMateria.mockResolvedValue(null);
      repository.buscarInscripcion.mockResolvedValue(null); // sin inscripción previa
      repository.crearInscripcion.mockResolvedValue({ id_usuario: 5, id_comision: 1, estado: 'ACTIVO' } as any);

      await service.agregarEstudiante(1, { id_usuario: 5 } as any);

      // La notificación debe mencionar "Comisión 1" como fallback al nombre null
      expect(notificacionesService.crearNotificacion).toHaveBeenCalledWith(
        expect.objectContaining({ mensaje: expect.stringContaining('Comisión 1') }),
      );
    });
  });

  // ─────────────────────────────────────────────
  // TRASLADO DE ESTUDIANTE ENTRE COMISIONES
  // ─────────────────────────────────────────────
  describe('trasladarEstudiante', () => {
    // Helper que crea un mock de transacción Prisma con el estado deseado en la comisión destino.
    // existeEnDestino = null → no hay inscripción previa (rama create)
    // existeEnDestino = objeto → ya existe inscripción (rama update/reactivar)
    const crearMockTx = (existeEnDestino: object | null = null) => ({
      usuarioComision: {
        update: jest.fn().mockResolvedValue({}),
        findUnique: jest.fn().mockResolvedValue(existeEnDestino),
        create: jest.fn().mockResolvedValue({}),
      },
    });

    // Comisión destino (id 2) — misma materia que la de origen
    const mockComisionDestino = {
      id_comision: 2,
      id_materia: 1,
      numero_comision: 2,
      nombre_comision: 'Comisión B',
      materia: { nombre_materia: 'Matemática' },
      profesor: { id_usuario: 10, nombre_usuario: 'Prof', apellido_usuario: 'Test' },
    };

    // Inscripción activa del alumno en la comisión origen (id 1)
    const mockInscripcionOrigen = {
      id_comision: 1,
      comision: {
        id_comision: 1,
        numero_comision: 1,
        nombre_comision: 'Comisión A',
        profesor: { id_usuario: 20, nombre_usuario: 'Otro', apellido_usuario: 'Profe' },
      },
    };

    it('debe ejecutar baja en origen y alta en destino atómicamente', async () => {
      repository.verificarExistencia.mockResolvedValue(mockComisionDestino as any);
      repository.buscarInscripcionActivaEnMateria.mockResolvedValue(mockInscripcionOrigen as any);
      // La transacción se mockea para resolverse sin ejecutar el callback interno
      repository.ejecutarTransaccion.mockResolvedValue(undefined);
      repository.buscarDatosAlumno.mockResolvedValue({
        id_usuario: 5, nombre_usuario: 'Juan', apellido_usuario: 'Pérez', dni: 12345678,
      } as any);

      await service.trasladarEstudiante(2, 5);

      // La transacción atómica debe haberse ejecutado y luego enviarse la notificación
      expect(repository.ejecutarTransaccion).toHaveBeenCalled();
      expect(notificacionesService.crearNotificacion).toHaveBeenCalled();
    });

    it('crea inscripción en destino cuando no existe previa (rama create)', async () => {
      // null en crearMockTx → findUnique retornará null → el servicio debe llamar a create
      const tx = crearMockTx(null);
      repository.verificarExistencia.mockResolvedValue(mockComisionDestino as any);
      repository.buscarInscripcionActivaEnMateria.mockResolvedValue(mockInscripcionOrigen as any);
      // La transacción ejecuta el callback real con el mock de tx
      repository.ejecutarTransaccion.mockImplementation(async (fn: any) => fn(tx));
      repository.buscarDatosAlumno.mockResolvedValue(null);

      await service.trasladarEstudiante(2, 5);

      // Rama create: se crea registro en destino + un update para dar de baja en origen
      expect(tx.usuarioComision.create).toHaveBeenCalled();
      expect(tx.usuarioComision.update).toHaveBeenCalledTimes(1);
    });

    it('reactiva inscripción en destino cuando ya existía (rama update)', async () => {
      // Objeto en crearMockTx → findUnique encuentra registro existente → el servicio debe reactivar con update
      const tx = crearMockTx({ id_usuario: 5, id_comision: 2 });
      repository.verificarExistencia.mockResolvedValue(mockComisionDestino as any);
      repository.buscarInscripcionActivaEnMateria.mockResolvedValue(mockInscripcionOrigen as any);
      repository.ejecutarTransaccion.mockImplementation(async (fn: any) => fn(tx));
      repository.buscarDatosAlumno.mockResolvedValue(null);

      await service.trasladarEstudiante(2, 5);

      // Rama update: dos updates (baja en origen + reactivar en destino), sin create
      expect(tx.usuarioComision.create).not.toHaveBeenCalled();
      expect(tx.usuarioComision.update).toHaveBeenCalledTimes(2);
    });

    it('usa fallback de nombre en la notificación cuando las comisiones no tienen nombre', async () => {
      // Ambas comisiones tienen nombre_comision null — la notificación debe usar "Comisión N"
      const comisionDestinoSinNombre = {
        ...mockComisionDestino,
        nombre_comision: null,
        numero_comision: 2,
        profesor: { id_usuario: 10, nombre_usuario: 'Prof', apellido_usuario: 'Test' },
      };
      const inscripcionOrigenSinNombre = {
        ...mockInscripcionOrigen,
        comision: { ...mockInscripcionOrigen.comision, nombre_comision: null, numero_comision: 1 },
      };
      repository.verificarExistencia.mockResolvedValue(comisionDestinoSinNombre as any);
      repository.buscarInscripcionActivaEnMateria.mockResolvedValue(inscripcionOrigenSinNombre as any);
      repository.ejecutarTransaccion.mockResolvedValue(undefined);
      repository.buscarDatosAlumno.mockResolvedValue({
        id_usuario: 5, nombre_usuario: 'Juan', apellido_usuario: 'Pérez', dni: 12345678,
      } as any);

      await service.trasladarEstudiante(2, 5);

      // La notificación debe incluir los nombres fallback correctos para origen y destino
      expect(notificacionesService.crearNotificacion).toHaveBeenCalledWith(
        expect.objectContaining({
          datos: expect.objectContaining({
            comision_origen: expect.objectContaining({ nombre: 'Comisión 1' }),
            comision_destino: expect.objectContaining({ nombre: 'Comisión 2' }),
          }),
        }),
      );
    });

    it('no llama a crearNotificacion cuando buscarDatosAlumno retorna null post-transacción', async () => {
      repository.verificarExistencia.mockResolvedValue(mockComisionDestino as any);
      repository.buscarInscripcionActivaEnMateria.mockResolvedValue(mockInscripcionOrigen as any);
      repository.ejecutarTransaccion.mockResolvedValue(undefined);
      // Alumno no encontrado post-transacción — no se envía notificación
      repository.buscarDatosAlumno.mockResolvedValue(null);

      await service.trasladarEstudiante(2, 5);

      expect(notificacionesService.crearNotificacion).not.toHaveBeenCalled();
    });

    it('debe lanzar NotFoundException si el alumno no tiene inscripción activa en la materia', async () => {
      repository.verificarExistencia.mockResolvedValue(mockComisionDestino as any);
      // null = no hay inscripción activa en la materia → no se puede trasladar
      repository.buscarInscripcionActivaEnMateria.mockResolvedValue(null);

      await expect(service.trasladarEstudiante(2, 5)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─────────────────────────────────────────────
  // ELIMINAR HORARIO DE UNA COMISIÓN
  // ─────────────────────────────────────────────
  describe('eliminarHorario', () => {
    it('debe lanzar NotFoundException si el horario no pertenece a la comisión', async () => {
      // null = el horario no existe o pertenece a otra comisión
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

      // Se llama a desactivarHorario con el ID correcto (soft delete)
      expect(repository.desactivarHorario).toHaveBeenCalledWith(10);
    });
  });

  // ─────────────────────────────────────────────
  // REACTIVAR HORARIO DE UNA COMISIÓN
  // ─────────────────────────────────────────────
  describe('reactivarHorario', () => {
    it('debe lanzar NotFoundException cuando el horario no pertenece a la comisión', async () => {
      repository.buscarHorario.mockResolvedValue(null);

      await expect(service.reactivarHorario(1, 999)).rejects.toThrow(NotFoundException);
    });

    it('debe reactivar el horario cuando existe', async () => {
      repository.buscarHorario.mockResolvedValue({ id_horario_comision: 10 } as any);
      repository.reactivarHorario.mockResolvedValue({ id_horario_comision: 10, activo: true } as any);

      const result = await service.reactivarHorario(1, 10);

      expect(repository.reactivarHorario).toHaveBeenCalledWith(10);
      // Se retorna el horario con activo: true
      expect(result).toEqual({ id_horario_comision: 10, activo: true });
    });
  });

  // ─────────────────────────────────────────────
  // COMISIONES INSCRIPTAS DE UN USUARIO
  // ─────────────────────────────────────────────
  describe('obtenerComisionesDeUsuario', () => {
    it('debe retornar las comisiones cuando el usuario existe', async () => {
      repository.verificarExistenciaUsuario.mockResolvedValue({ id_usuario: 5 } as any);
      repository.obtenerComisionesDeUsuario.mockResolvedValue([{ id_comision: 1 }] as any);

      const result = await service.obtenerComisionesDeUsuario(5);

      expect(repository.verificarExistenciaUsuario).toHaveBeenCalledWith(5);
      expect(repository.obtenerComisionesDeUsuario).toHaveBeenCalledWith(5);
      expect(result).toEqual([{ id_comision: 1 }]);
    });

    it('debe lanzar NotFoundException cuando el usuario no existe', async () => {
      // null = el usuario no existe en el sistema
      repository.verificarExistenciaUsuario.mockResolvedValue(null);

      await expect(service.obtenerComisionesDeUsuario(999)).rejects.toThrow(NotFoundException);
    });
  });

  // ─────────────────────────────────────────────
  // BAJA DE ESTUDIANTE DE UNA COMISIÓN
  // ─────────────────────────────────────────────
  describe('darBajaEstudiante', () => {
    it('debe dar de baja al estudiante cuando existe la inscripción', async () => {
      repository.verificarExistencia.mockResolvedValue({ id_comision: 1 } as any);
      // La inscripción existe y está activa
      repository.buscarInscripcion.mockResolvedValue({ id_usuario: 5, id_comision: 1, estado: 'ACTIVO' } as any);
      repository.darBajaInscripcion.mockResolvedValue(undefined);

      await service.darBajaEstudiante(1, 5);

      expect(repository.darBajaInscripcion).toHaveBeenCalledWith(5, 1);
    });

    it('debe lanzar NotFoundException cuando la comisión no existe', async () => {
      // null = la comisión no existe
      repository.verificarExistencia.mockResolvedValue(null);

      await expect(service.darBajaEstudiante(999, 5)).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar NotFoundException cuando el estudiante no está inscripto en la comisión', async () => {
      repository.verificarExistencia.mockResolvedValue({ id_comision: 1 } as any);
      // null = no hay inscripción (ni activa ni dada de baja) para este usuario en esta comisión
      repository.buscarInscripcion.mockResolvedValue(null);

      await expect(service.darBajaEstudiante(1, 99)).rejects.toThrow(NotFoundException);
    });
  });

  // ─────────────────────────────────────────────
  // MODIFICAR EVENTO DE UNA COMISIÓN
  // ─────────────────────────────────────────────
  describe('modificarEvento', () => {
    it('debe lanzar BadRequestException si fecha_fin <= fecha_inicio cuando ambas se proveen', async () => {
      // Validación de rango de fechas antes de consultar al repositorio
      await expect(
        service.modificarEvento(1, 5, {
          fecha_inicio: '2026-06-20T10:00:00.000Z',
          fecha_fin: '2026-06-20T08:00:00.000Z',
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe lanzar NotFoundException cuando el evento no pertenece a la comisión', async () => {
      // null = el evento no existe o pertenece a otra comisión
      repository.buscarEvento.mockResolvedValue(null);

      await expect(service.modificarEvento(1, 999, {} as any)).rejects.toThrow(NotFoundException);
    });

    it('debe modificar el evento cuando existe y los datos son válidos', async () => {
      repository.buscarEvento.mockResolvedValue({ id_evento: 5, titulo: 'Parcial' } as any);
      repository.modificarEvento.mockResolvedValue({ id_evento: 5, titulo: 'Parcial actualizado' } as any);

      const result = await service.modificarEvento(1, 5, { titulo: 'Parcial actualizado' } as any);

      // Verifica que se buscó el evento con el par (id_evento, id_comision)
      expect(repository.buscarEvento).toHaveBeenCalledWith(5, 1);
      expect(repository.modificarEvento).toHaveBeenCalledWith(5, { titulo: 'Parcial actualizado' });
      expect(result).toEqual({ id_evento: 5, titulo: 'Parcial actualizado' });
    });
  });

  // ─────────────────────────────────────────────
  // ELIMINAR EVENTO DE UNA COMISIÓN
  // ─────────────────────────────────────────────
  describe('eliminarEvento', () => {
    it('debe lanzar NotFoundException cuando el evento no pertenece a la comisión', async () => {
      repository.buscarEvento.mockResolvedValue(null);

      await expect(service.eliminarEvento(1, 999)).rejects.toThrow(NotFoundException);
    });

    it('debe desactivar el evento cuando existe', async () => {
      repository.buscarEvento.mockResolvedValue({ id_evento: 5 } as any);
      repository.desactivarEvento.mockResolvedValue(undefined);

      await service.eliminarEvento(1, 5);

      // Soft delete: desactiva el evento sin eliminarlo físicamente
      expect(repository.desactivarEvento).toHaveBeenCalledWith(5);
    });
  });

  // ─────────────────────────────────────────────
  // REACTIVAR EVENTO DE UNA COMISIÓN
  // ─────────────────────────────────────────────
  describe('reactivarEvento', () => {
    it('debe lanzar NotFoundException cuando el evento no pertenece a la comisión', async () => {
      repository.buscarEvento.mockResolvedValue(null);

      await expect(service.reactivarEvento(1, 999)).rejects.toThrow(NotFoundException);
    });

    it('debe reactivar el evento cuando existe', async () => {
      repository.buscarEvento.mockResolvedValue({ id_evento: 5 } as any);
      repository.reactivarEvento.mockResolvedValue({ id_evento: 5, activo: true } as any);

      const result = await service.reactivarEvento(1, 5);

      expect(repository.reactivarEvento).toHaveBeenCalledWith(5);
      // Se retorna el evento con activo: true
      expect(result).toEqual({ id_evento: 5, activo: true });
    });
  });

  // ─────────────────────────────────────────────
  // VERIFICACIÓN DE AUTORÍA — PROFESOR DE COMISIÓN
  // ─────────────────────────────────────────────
  describe('verificarProfesorDeComision', () => {
    it('no lanza excepción cuando la comisión no tiene profesor asignado', async () => {
      // null = la comisión existe pero no tiene profesor → cualquier auth puede pasar
      repository.buscarComisionConProfesor.mockResolvedValue(null);

      await expect(service.verificarProfesorDeComision('auth-123', 1)).resolves.toBeUndefined();
    });

    it('no lanza excepción cuando el auth ID coincide con el del profesor', async () => {
      // El supabase_auth_id del profesor coincide con el token enviado
      repository.buscarComisionConProfesor.mockResolvedValue({
        profesor: { supabase_auth_id: 'auth-abc' },
      } as any);

      await expect(service.verificarProfesorDeComision('auth-abc', 1)).resolves.toBeUndefined();
    });

    it('debe lanzar ForbiddenException cuando el auth ID no coincide con el del profesor', async () => {
      // El token no corresponde al profesor de esta comisión → acceso denegado
      repository.buscarComisionConProfesor.mockResolvedValue({
        profesor: { supabase_auth_id: 'auth-abc' },
      } as any);

      await expect(service.verificarProfesorDeComision('auth-otro', 1)).rejects.toThrow(ForbiddenException);
    });
  });
});

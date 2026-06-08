import { Test, TestingModule } from '@nestjs/testing';
import { Logger, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { IntercambiosService } from './intercambios.service';
import { IntercambiosRepository } from './repositories/intercambios.repository';
import { IntercambioCompletadoSubject } from './observers/intercambio-completado.subject';

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const estadoPendiente = { id_estado: 1, nombre_estado: 'PENDIENTE' };
const estadoCompletado = { id_estado: 2, nombre_estado: 'COMPLETADO' };

const buildDatosCompletos = (mismoProfesor = false) => ({
  id_intercambio: 10,
  id_estado: 1,
  id_comision_ofrece: 100,
  id_comision_destino: 200,
  ofrece: {
    usuario: {
      id_usuario: 1,
      nombre_usuario: 'Juan',
      apellido_usuario: 'Pérez',
      dni: 11111111,
      correo: 'juan@example.com',
    },
    comision: {
      id_comision: 100,
      nombre_comision: 'Comisión A',
      numero_comision: 1,
      profesor: {
        id_usuario: mismoProfesor ? 99 : 10,
        nombre_usuario: 'Profe',
        apellido_usuario: 'A',
        correo: 'profe.a@example.com',
      },
    },
  },
  destino: {
    usuario: {
      id_usuario: 2,
      nombre_usuario: 'María',
      apellido_usuario: 'López',
      dni: 22222222,
      correo: 'maria@example.com',
    },
    comision: {
      id_comision: 200,
      nombre_comision: 'Comisión B',
      numero_comision: 2,
      profesor: {
        id_usuario: mismoProfesor ? 99 : 20,
        nombre_usuario: 'Profe',
        apellido_usuario: mismoProfesor ? 'A' : 'B',
        correo: mismoProfesor ? 'profe.a@example.com' : 'profe.b@example.com',
      },
    },
  },
});

// ─── Test suite ───────────────────────────────────────────────────────────────

describe('IntercambiosService', () => {
  let service: IntercambiosService;
  let intercambiosRepo: jest.Mocked<IntercambiosRepository>;
  let subject: jest.Mocked<IntercambioCompletadoSubject>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IntercambiosService,
        {
          provide: IntercambiosRepository,
          useValue: {
            obtenerDatosCompletos: jest.fn(),
            buscarEstadoPorNombre: jest.fn(),
            completarIntercambio: jest.fn().mockResolvedValue(undefined),
            obtenerPorUsuario: jest.fn(),
            obtenerPorId: jest.fn(),
            verificarInscripcionesActivas: jest.fn(),
            verificarMismaMateria: jest.fn(),
            obtenerCandidatos: jest.fn(),
            buscarIntercambioPendiente: jest.fn(),
            crearIntercambio: jest.fn(),
          },
        },
        {
          provide: IntercambioCompletadoSubject,
          useValue: {
            notificar: jest.fn().mockResolvedValue({ comprobanteUrl: 'https://cdn.example.com/10.pdf' }),
          },
        },
      ],
    }).compile();

    service = module.get<IntercambiosService>(IntercambiosService);
    intercambiosRepo = module.get(IntercambiosRepository);
    subject = module.get(IntercambioCompletadoSubject);

    // Default happy path
    intercambiosRepo.obtenerDatosCompletos.mockResolvedValue(buildDatosCompletos() as any);
    intercambiosRepo.buscarEstadoPorNombre.mockImplementation(async (nombre) => {
      if (nombre === 'PENDIENTE') return estadoPendiente as any;
      if (nombre === 'COMPLETADO') return estadoCompletado as any;
      return null;
    });

    // Silence Logger output in tests
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─── obtenerPorUsuario ────────────────────────────────────────────────────

  describe('obtenerPorUsuario', () => {
    it('debe retornar la lista de intercambios del usuario', async () => {
      intercambiosRepo.obtenerPorUsuario.mockResolvedValue([
        { fecha_solicitud: new Date(), id_intercambio: 1 },
      ] as any);

      const result = await service.obtenerPorUsuario(1);

      expect(intercambiosRepo.obtenerPorUsuario).toHaveBeenCalledWith(1);
      expect(result).toHaveLength(1);
    });

    it('debe retornar array vacío cuando el usuario no tiene intercambios', async () => {
      intercambiosRepo.obtenerPorUsuario.mockResolvedValue([]);

      const result = await service.obtenerPorUsuario(1);

      expect(result).toEqual([]);
    });
  });

  // ─── obtenerPorId ─────────────────────────────────────────────────────────

  describe('obtenerPorId', () => {
    it('debe retornar el intercambio cuando existe', async () => {
      intercambiosRepo.obtenerPorId.mockResolvedValue(
        { fecha_solicitud: new Date(), id_intercambio: 10 } as any,
      );

      const result = await service.obtenerPorId(10);

      expect(intercambiosRepo.obtenerPorId).toHaveBeenCalledWith(10);
      expect(result).toBeDefined();
    });

    it('debe lanzar NotFoundException cuando el intercambio no existe', async () => {
      intercambiosRepo.obtenerPorId.mockResolvedValue(null);

      await expect(service.obtenerPorId(999)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── obtenerCandidatos ────────────────────────────────────────────────────

  describe('obtenerCandidatos', () => {
    const mockDto = { id_comision_origen: 1, id_usuario_solicitante: 1 };

    it('debe retornar la lista de candidatos cuando la comisión origen existe', async () => {
      const candidatos = [
        {
          usuario: { id_usuario: 2, nombre_usuario: 'Ana', apellido_usuario: 'García', dni: 123 },
          comision: { id_comision: 5, numero_comision: 2, nombre_comision: null },
        },
      ];
      intercambiosRepo.obtenerCandidatos.mockResolvedValue(candidatos as any);

      const result = await service.obtenerCandidatos(mockDto as any);

      expect(intercambiosRepo.obtenerCandidatos).toHaveBeenCalledWith(1, 1);
      expect(result).toEqual(candidatos);
    });

    it('debe retornar array vacío cuando no hay candidatos disponibles', async () => {
      intercambiosRepo.obtenerCandidatos.mockResolvedValue([]);

      const result = await service.obtenerCandidatos(mockDto as any);

      expect(result).toEqual([]);
    });

    it('debe lanzar NotFoundException cuando la comisión origen no existe', async () => {
      intercambiosRepo.obtenerCandidatos.mockResolvedValue(null);

      await expect(service.obtenerCandidatos(mockDto as any)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── crear ────────────────────────────────────────────────────────────────

  describe('crear', () => {
    const mockDto = {
      id_comision_ofrece: 1,
      id_usuario_ofrece: 1,
      id_comision_destino: 2,
      id_usuario_destino: 2,
    };

    it('debe lanzar BadRequestException cuando alguna inscripción no está activa', async () => {
      intercambiosRepo.verificarInscripcionesActivas.mockResolvedValue(false as any);

      await expect(service.crearIntercambio(mockDto as any)).rejects.toThrow(BadRequestException);
    });

    it('debe lanzar BadRequestException cuando las comisiones pertenecen a materias distintas', async () => {
      intercambiosRepo.verificarInscripcionesActivas.mockResolvedValue(true as any);
      intercambiosRepo.verificarMismaMateria.mockResolvedValue(false as any);

      await expect(service.crearIntercambio(mockDto as any)).rejects.toThrow(BadRequestException);
      expect(intercambiosRepo.buscarIntercambioPendiente).not.toHaveBeenCalled();
    });

    it('debe lanzar ConflictException cuando ya existe un intercambio pendiente entre esas comisiones', async () => {
      intercambiosRepo.verificarInscripcionesActivas.mockResolvedValue(true as any);
      intercambiosRepo.verificarMismaMateria.mockResolvedValue(true as any);
      intercambiosRepo.buscarIntercambioPendiente.mockResolvedValue({ id_intercambio: 3 } as any);

      await expect(service.crearIntercambio(mockDto as any)).rejects.toThrow(ConflictException);
    });

    it('debe crear el intercambio en estado PENDIENTE cuando todas las validaciones pasan', async () => {
      intercambiosRepo.verificarInscripcionesActivas.mockResolvedValue(true as any);
      intercambiosRepo.verificarMismaMateria.mockResolvedValue(true as any);
      intercambiosRepo.buscarIntercambioPendiente.mockResolvedValue(null);
      intercambiosRepo.crearIntercambio.mockResolvedValue(
        { fecha_solicitud: new Date(), id_intercambio: 5 } as any,
      );

      const result = await service.crearIntercambio(mockDto as any);

      expect(intercambiosRepo.crearIntercambio).toHaveBeenCalledWith(mockDto, estadoPendiente.id_estado);
      expect(result).toBeDefined();
    });

    it('debe lanzar NotFoundException cuando el estado PENDIENTE no está configurado en BD', async () => {
      intercambiosRepo.verificarInscripcionesActivas.mockResolvedValue(true as any);
      intercambiosRepo.verificarMismaMateria.mockResolvedValue(true as any);
      intercambiosRepo.buscarIntercambioPendiente.mockResolvedValue(null);
      intercambiosRepo.buscarEstadoPorNombre.mockResolvedValue(null);

      await expect(service.crearIntercambio(mockDto as any)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── completar ────────────────────────────────────────────────────────────
  //
  // `completar` quedó reducido a: validar → completarIntercambio (sin notificaciones)
  // → construir IntercambioCompletadoEvent → subject.notificar → CompletarResultado.
  // Los ~8 tests de side-effects (PDF/storage/comprobante/emails/notificaciones)
  // MIGRARON a comprobante.observer.spec.ts / email.observer.spec.ts /
  // notificacion.observer.spec.ts — ahí cubren su propia unidad aislada.

  describe('completar', () => {
    it('lanza NotFoundException cuando el intercambio no existe', async () => {
      intercambiosRepo.obtenerDatosCompletos.mockResolvedValue(null);

      await expect(service.completar(10)).rejects.toThrow(NotFoundException);
      expect(subject.notificar).not.toHaveBeenCalled();
    });

    it('lanza ConflictException cuando el intercambio no está en estado PENDIENTE', async () => {
      intercambiosRepo.obtenerDatosCompletos.mockResolvedValue({
        ...buildDatosCompletos(),
        id_estado: 99,
      } as any);

      await expect(service.completar(10)).rejects.toThrow(ConflictException);
      expect(subject.notificar).not.toHaveBeenCalled();
    });

    it('lanza NotFoundException cuando el estado COMPLETADO no está configurado en BD', async () => {
      intercambiosRepo.buscarEstadoPorNombre.mockImplementation(async (nombre) =>
        nombre === 'PENDIENTE' ? estadoPendiente as any : null,
      );

      await expect(service.completar(10)).rejects.toThrow(NotFoundException);
      expect(subject.notificar).not.toHaveBeenCalled();
      expect(intercambiosRepo.completarIntercambio).not.toHaveBeenCalled();
    });

    it('llama a completarIntercambio sin notificaciones (3 argumentos)', async () => {
      await service.completar(10);

      expect(intercambiosRepo.completarIntercambio).toHaveBeenCalledWith(
        10,
        {
          id_usuario_ofrece: 1,
          id_comision_ofrece: 100,
          id_usuario_destino: 2,
          id_comision_destino: 200,
        },
        estadoCompletado.id_estado,
      );
      expect(intercambiosRepo.completarIntercambio.mock.calls[0]).toHaveLength(3);
    });

    it('emite IntercambioCompletadoEvent vía subject.notificar solo después de que completarIntercambio resuelve', async () => {
      const orden: string[] = [];
      intercambiosRepo.completarIntercambio.mockImplementation(async () => {
        orden.push('completarIntercambio');
      });
      subject.notificar.mockImplementation(async () => {
        orden.push('notificar');
        return { comprobanteUrl: 'https://cdn.example.com/10.pdf' };
      });

      await service.completar(10);

      expect(orden).toEqual(['completarIntercambio', 'notificar']);
      expect(subject.notificar).toHaveBeenCalledWith(
        expect.objectContaining({
          id_intercambio: 10,
          id_comision_ofrece: 100,
          id_comision_destino: 200,
          completadoEn: expect.any(Date),
          ofrece: expect.objectContaining({
            usuario: expect.objectContaining({ id_usuario: 1 }),
          }),
          destino: expect.objectContaining({
            usuario: expect.objectContaining({ id_usuario: 2 }),
          }),
        }),
      );
    });

    it('retorna CompletarResultado { id_intercambio, comprobante_url } construido desde el resultado del subject', async () => {
      subject.notificar.mockResolvedValue({ comprobanteUrl: 'https://cdn.example.com/url-final.pdf' });

      const resultado = await service.completar(10);

      expect(resultado).toEqual({ id_intercambio: 10, comprobante_url: 'https://cdn.example.com/url-final.pdf' });
    });

    it('propaga el error si el subject (observer crítico) lanza, dejando el Intercambio ya COMPLETADO', async () => {
      subject.notificar.mockRejectedValue(new Error('Storage unavailable'));

      await expect(service.completar(10)).rejects.toThrow('Storage unavailable');
      // completarIntercambio ya corrió y resolvió — no hay rollback de la transacción
      expect(intercambiosRepo.completarIntercambio).toHaveBeenCalled();
    });
  });
});

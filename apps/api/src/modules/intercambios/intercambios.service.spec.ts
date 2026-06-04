import { Test, TestingModule } from '@nestjs/testing';
import { Logger, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { IntercambiosService } from './intercambios.service';
import { IntercambiosRepository } from './repositories/intercambios.repository';
import { ComprobantePdfService } from '../comprobantes/services/comprobante-pdf.service';
import { ComprobantesStorageService } from '../comprobantes/services/comprobantes-storage.service';
import { ComprobantesRepository } from '../comprobantes/repositories/comprobantes.repository';
import { EmailService } from '../email/email.service';

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
  let pdfService: jest.Mocked<ComprobantePdfService>;
  let storageService: jest.Mocked<ComprobantesStorageService>;
  let comprobantesRepo: jest.Mocked<ComprobantesRepository>;
  let emailService: jest.Mocked<EmailService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IntercambiosService,
        {
          provide: IntercambiosRepository,
          useValue: {
            obtenerDatosCompletos: jest.fn(),
            buscarEstadoPorNombre: jest.fn(),
            completarAtomico: jest.fn().mockResolvedValue(undefined),
            obtenerPorUsuario: jest.fn(),
            obtenerPorId: jest.fn(),
            verificarInscripcionesActivas: jest.fn(),
            buscarIntercambioPendiente: jest.fn(),
            crearIntercambio: jest.fn(),
          },
        },
        {
          provide: ComprobantePdfService,
          useValue: { generar: jest.fn().mockResolvedValue(Buffer.from('pdf')) },
        },
        {
          provide: ComprobantesStorageService,
          useValue: { subir: jest.fn().mockResolvedValue('https://cdn.example.com/1.pdf') },
        },
        {
          provide: ComprobantesRepository,
          useValue: { crearComprobante: jest.fn().mockResolvedValue({ id_comprobante: 1 }) },
        },
        {
          provide: EmailService,
          useValue: {
            enviarComprobanteAlumno: jest.fn().mockResolvedValue(undefined),
            enviarNotificacionProfesor: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<IntercambiosService>(IntercambiosService);
    intercambiosRepo = module.get(IntercambiosRepository);
    pdfService = module.get(ComprobantePdfService);
    storageService = module.get(ComprobantesStorageService);
    comprobantesRepo = module.get(ComprobantesRepository);
    emailService = module.get(EmailService);

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

    it('debe lanzar ConflictException cuando ya existe un intercambio pendiente entre esas comisiones', async () => {
      intercambiosRepo.verificarInscripcionesActivas.mockResolvedValue(true as any);
      intercambiosRepo.buscarIntercambioPendiente.mockResolvedValue({ id_intercambio: 3 } as any);

      await expect(service.crearIntercambio(mockDto as any)).rejects.toThrow(ConflictException);
    });

    it('debe crear el intercambio en estado PENDIENTE cuando todas las validaciones pasan', async () => {
      intercambiosRepo.verificarInscripcionesActivas.mockResolvedValue(true as any);
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
      intercambiosRepo.buscarIntercambioPendiente.mockResolvedValue(null);
      intercambiosRepo.buscarEstadoPorNombre.mockResolvedValue(null);

      await expect(service.crearIntercambio(mockDto as any)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── completar ────────────────────────────────────────────────────────────

  describe('completar', () => {
    it('lanza NotFoundException cuando el intercambio no existe', async () => {
      intercambiosRepo.obtenerDatosCompletos.mockResolvedValue(null);

      await expect(service.completar(10)).rejects.toThrow(NotFoundException);
    });

<<<<<<< Updated upstream
    it('lanza ConflictException cuando el intercambio no está en estado PENDIENTE', async () => {
      intercambiosRepo.obtenerDatosCompletos.mockResolvedValue({
        ...buildDatosCompletos(),
        id_estado: 99,
      } as any);

      await expect(service.completar(10)).rejects.toThrow(ConflictException);
    });

    it('lanza NotFoundException cuando el estado COMPLETADO no está configurado en BD', async () => {
      intercambiosRepo.buscarEstadoPorNombre.mockImplementation(async (nombre) =>
        nombre === 'PENDIENTE' ? estadoPendiente as any : null,
      );

      await expect(service.completar(10)).rejects.toThrow(NotFoundException);
    });

    it('resuelve sin error y llama a logger.error cuando enviarNotificacionProfesor falla', async () => {
      emailService.enviarNotificacionProfesor.mockRejectedValue(new Error('SMTP timeout'));

      await expect(service.completar(10)).resolves.toBeUndefined();
      expect(Logger.prototype.error).toHaveBeenCalled();
    });

    it('resuelve sin error y llama a logger.error cuando enviarComprobanteAlumno falla', async () => {
      emailService.enviarComprobanteAlumno.mockRejectedValue(new Error('SMTP down'));

      await expect(service.completar(10)).resolves.toBeUndefined();
      expect(Logger.prototype.error).toHaveBeenCalled();
    });

    it('usa fallback de nombre cuando nombre_comision es null en ambas comisiones', async () => {
      const datos = buildDatosCompletos();
      (datos.ofrece.comision as any).nombre_comision = null;
      (datos.destino.comision as any).nombre_comision = null;
      intercambiosRepo.obtenerDatosCompletos.mockResolvedValue(datos as any);

      await expect(service.completar(10)).resolves.toBeUndefined();
    });

    it('envía un único email al profesor cuando ambas comisiones comparten el mismo profesor', async () => {
      intercambiosRepo.obtenerDatosCompletos.mockResolvedValue(buildDatosCompletos(true) as any);

      await service.completar(10);

      expect(emailService.enviarNotificacionProfesor).toHaveBeenCalledTimes(1);
    });

    it('envía dos emails a profesores cuando son distintos', async () => {
      intercambiosRepo.obtenerDatosCompletos.mockResolvedValue(buildDatosCompletos(false) as any);

      await service.completar(10);

      expect(emailService.enviarNotificacionProfesor).toHaveBeenCalledTimes(2);
    });

    it('lanza el error de storage y no guarda el comprobante en BD', async () => {
      storageService.subir.mockRejectedValue(new Error('Storage unavailable'));

      await expect(service.completar(10)).rejects.toThrow('Storage unavailable');
      expect(comprobantesRepo.crearComprobante).not.toHaveBeenCalled();
    });

    it('genera el PDF y lo sube al storage con el id del intercambio', async () => {
      await service.completar(10);

      expect(pdfService.generar).toHaveBeenCalledTimes(1);
      expect(storageService.subir).toHaveBeenCalledWith(10, expect.any(Buffer));
    });

    it('guarda el comprobante en base de datos con la URL del storage', async () => {
      await service.completar(10);

      expect(comprobantesRepo.crearComprobante).toHaveBeenCalledWith(10, 'https://cdn.example.com/1.pdf');
    });

    it('envía el comprobante por email a ambos alumnos del intercambio', async () => {
      await service.completar(10);

      expect(emailService.enviarComprobanteAlumno).toHaveBeenCalledTimes(2);
    });
  });
});

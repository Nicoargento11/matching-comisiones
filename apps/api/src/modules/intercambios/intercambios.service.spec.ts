import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
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

describe('IntercambiosService.completar()', () => {
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
          useValue: { crear: jest.fn().mockResolvedValue({ id_comprobante: 1 }) },
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

  // ── Task 5.4: soft-fail when enviarComprobanteAlumno throws ────────────────
  it('5.4 — resolves and calls logger.error when email throws (soft-fail)', async () => {
    emailService.enviarComprobanteAlumno.mockRejectedValue(new Error('SMTP down'));

    await expect(service.completar(10)).resolves.toBeUndefined();
    expect(Logger.prototype.error).toHaveBeenCalled();
  });

  // ── Task 5.5: professor dedup — same id_usuario → only one email ───────────
  it('5.5 — sends exactly one professor email when both comisions share the same professor', async () => {
    intercambiosRepo.obtenerDatosCompletos.mockResolvedValue(buildDatosCompletos(true) as any);

    await service.completar(10);

    expect(emailService.enviarNotificacionProfesor).toHaveBeenCalledTimes(1);
  });

  it('5.5 — sends two professor emails when professors are different', async () => {
    intercambiosRepo.obtenerDatosCompletos.mockResolvedValue(buildDatosCompletos(false) as any);

    await service.completar(10);

    expect(emailService.enviarNotificacionProfesor).toHaveBeenCalledTimes(2);
  });

  // ── Task 5.6: storage failure → error propagates, repo.crear never called ──
  it('5.6 — propagates error when storage throws, and does not call comprobantesRepo.crear', async () => {
    storageService.subir.mockRejectedValue(new Error('Storage unavailable'));

    await expect(service.completar(10)).rejects.toThrow('Storage unavailable');
    expect(comprobantesRepo.crear).not.toHaveBeenCalled();
  });

  // ── Happy path sanity ──────────────────────────────────────────────────────
  it('calls all hard-fail steps in order on success', async () => {
    await service.completar(10);

    expect(pdfService.generar).toHaveBeenCalledTimes(1);
    expect(storageService.subir).toHaveBeenCalledWith(10, expect.any(Buffer));
    expect(comprobantesRepo.crear).toHaveBeenCalledWith(10, 'https://cdn.example.com/1.pdf');
    expect(emailService.enviarComprobanteAlumno).toHaveBeenCalledTimes(2);
  });
});

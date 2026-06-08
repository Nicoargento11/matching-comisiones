import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { EmailObserver } from './email.observer';
import { EmailService } from '../../email/email.service';
import { ComprobantePdfService } from '../../comprobantes/services/comprobante-pdf.service';
import { IntercambioCompletadoEvent } from '../events/intercambio-completado.event';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function buildEvento(mismoProfesor = false): IntercambioCompletadoEvent {
  return {
    id_intercambio: 10,
    id_comision_ofrece: 100,
    id_comision_destino: 200,
    completadoEn: new Date('2026-01-01T00:00:00.000Z'),
    ofrece: {
      usuario: { id_usuario: 1, nombre_usuario: 'Juan', apellido_usuario: 'Pérez', dni: 11111111, correo: 'juan@example.com' },
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
      usuario: { id_usuario: 2, nombre_usuario: 'María', apellido_usuario: 'López', dni: 22222222, correo: 'maria@example.com' },
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
  };
}

function rateLimitError(): Error {
  const err = new Error('Data command failed: 550 5.7.0 Too many emails per second. Please upgrade your plan') as any;
  err.responseCode = 550;
  err.response = '550 5.7.0 Too many emails per second. Please upgrade your plan https://mailtrap.io/billing/plans/testing';
  err.code = 'EENVELOPE';
  return err;
}

function smtpTimeoutError(): Error {
  const err = new Error('SMTP timeout') as any;
  err.code = 'ETIMEDOUT';
  return err;
}

// ─── Test suite ───────────────────────────────────────────────────────────────

describe('EmailObserver', () => {
  let observer: EmailObserver;
  let emailService: jest.Mocked<EmailService>;
  let pdfService: jest.Mocked<ComprobantePdfService>;

  beforeEach(async () => {
    // setTimeout instantáneo en tests para que los delays de retry no sumen tiempo
    jest.spyOn(global, 'setTimeout').mockImplementation(((fn: () => void) => {
      fn();
      return 1 as unknown as NodeJS.Timeout;
    }) as typeof setTimeout);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailObserver,
        {
          provide: EmailService,
          useValue: {
            enviarComprobanteAlumno: jest.fn().mockResolvedValue(undefined),
            enviarNotificacionProfesor: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: ComprobantePdfService,
          useValue: { generarPdf: jest.fn().mockResolvedValue(Buffer.from('pdf')) },
        },
      ],
    }).compile();

    observer = module.get(EmailObserver);
    emailService = module.get(EmailService);
    pdfService = module.get(ComprobantePdfService);

    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ── Contrato del observer ──────────────────────────────────────────────────

  it('declara failureMode = best-effort', () => {
    expect(observer.failureMode).toBe('best-effort');
  });

  it('retorna void', async () => {
    const resultado = await observer.onIntercambioCompletado(buildEvento());
    expect(resultado).toBeUndefined();
  });

  // ── Flujo normal ───────────────────────────────────────────────────────────

  it('regenera el PDF a partir del payload del evento', async () => {
    await observer.onIntercambioCompletado(buildEvento());

    expect(pdfService.generarPdf).toHaveBeenCalledTimes(1);
    expect(pdfService.generarPdf).toHaveBeenCalledWith(
      expect.objectContaining({ idIntercambio: 10 }),
    );
  });

  it('envía el comprobante a ambos alumnos', async () => {
    const evento = buildEvento();
    await observer.onIntercambioCompletado(evento);

    expect(emailService.enviarComprobanteAlumno).toHaveBeenCalledTimes(2);
    expect(emailService.enviarComprobanteAlumno).toHaveBeenCalledWith(
      'juan@example.com',
      expect.objectContaining({ idIntercambio: 10 }),
      expect.any(Buffer),
    );
    expect(emailService.enviarComprobanteAlumno).toHaveBeenCalledWith(
      'maria@example.com',
      expect.objectContaining({ idIntercambio: 10 }),
      expect.any(Buffer),
    );
  });

  it('envía notificación a profesores deduplicados por id_usuario (2 distintos → 2 emails)', async () => {
    await observer.onIntercambioCompletado(buildEvento(false));

    expect(emailService.enviarNotificacionProfesor).toHaveBeenCalledTimes(2);
  });

  it('dedupea profesores cuando comparten id_usuario (mismo profesor → 1 email)', async () => {
    await observer.onIntercambioCompletado(buildEvento(true));

    expect(emailService.enviarNotificacionProfesor).toHaveBeenCalledTimes(1);
  });

  it('aísla el fallo de un destinatario: si un email falla, los demás igual se envían', async () => {
    emailService.enviarComprobanteAlumno
      .mockRejectedValueOnce(new Error('SMTP timeout'))
      .mockResolvedValueOnce(undefined);

    await observer.onIntercambioCompletado(buildEvento());

    expect(emailService.enviarComprobanteAlumno).toHaveBeenCalledTimes(2);
    expect(Logger.prototype.error).toHaveBeenCalled();
  });

  it('no propaga si el envío a un profesor falla (best-effort)', async () => {
    emailService.enviarNotificacionProfesor.mockRejectedValue(new Error('SMTP down'));

    await expect(observer.onIntercambioCompletado(buildEvento())).resolves.toBeUndefined();
    expect(Logger.prototype.error).toHaveBeenCalled();
  });

  // ── Rate limit retry ───────────────────────────────────────────────────────

  it('reintenta con backoff cuando el proveedor responde 550 "Too many emails"', async () => {
    // Primer intento: rate limit → reintenta. Segundo intento: éxito.
    emailService.enviarComprobanteAlumno
      .mockRejectedValueOnce(rateLimitError())
      .mockResolvedValueOnce(undefined);

    await observer.onIntercambioCompletado(buildEvento());

    // juan@example.com: 1er intento falla (rate limit) → 2do intento (retry) éxito = 2 calls
    // maria@example.com: éxito directo = 1 call
    // Total: 3 calls
    expect(emailService.enviarComprobanteAlumno).toHaveBeenCalledTimes(3);
  });

  it('reintenta hasta MAX_RETRIES y luego loguea error si el rate limit persiste', async () => {
    // Todas las llamadas fallan con rate limit
    emailService.enviarComprobanteAlumno.mockRejectedValue(rateLimitError());
    emailService.enviarNotificacionProfesor.mockResolvedValue(undefined);

    await observer.onIntercambioCompletado(buildEvento());

    // juan: 1 inicial + 2 retries = 3 intentos
    // maria: 1 inicial + 2 retries = 3 intentos
    // Después de agotar retries para juan, se loguea error y continúa con maria
    expect(Logger.prototype.error).toHaveBeenCalled();
    expect(Logger.prototype.warn).toHaveBeenCalled(); // warnings de rate limit
    // Ambos alumnos fueron intentados
    const juanCalls = emailService.enviarComprobanteAlumno.mock.calls.filter(
      ([correo]) => correo === 'juan@example.com',
    );
    const mariaCalls = emailService.enviarComprobanteAlumno.mock.calls.filter(
      ([correo]) => correo === 'maria@example.com',
    );
    expect(juanCalls.length).toBe(3); // 1 inicial + 2 retries
    expect(mariaCalls.length).toBe(3);
  });

  it('NO reintenta ante errores que no son de rate limit (ej. SMTP timeout)', async () => {
    emailService.enviarComprobanteAlumno.mockRejectedValueOnce(smtpTimeoutError());

    await observer.onIntercambioCompletado(buildEvento());

    // juan: falla con timeout → loguea error → NO reintenta → pasa a maria
    // maria: resuelve normalmente (default mock)
    expect(emailService.enviarComprobanteAlumno).toHaveBeenCalledTimes(2); // juan(1) + maria(1)
  });

  it('aplica backoff creciente entre reintentos (5s → 10s)', async () => {
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
    emailService.enviarComprobanteAlumno.mockRejectedValue(rateLimitError());

    await observer.onIntercambioCompletado(buildEvento());

    // Los delays se llaman con setTimeout(..., ms). Verificamos los valores.
    const delayCalls = setTimeoutSpy.mock.calls
      .filter(([, ms]) => typeof ms === 'number' && ms > 0)
      .map(([, ms]) => ms);

    // Para juan: 5000 (1er retry), 10000 (2do retry). Ídem para maria.
    expect(delayCalls.filter((ms) => ms === 5000).length).toBeGreaterThanOrEqual(2);
    expect(delayCalls.filter((ms) => ms === 10000).length).toBeGreaterThanOrEqual(2);
    setTimeoutSpy.mockRestore();
  });

  it('escribe warning de rate limit antes de cada reintento', async () => {
    emailService.enviarComprobanteAlumno.mockRejectedValueOnce(rateLimitError());

    await observer.onIntercambioCompletado(buildEvento());

    expect(Logger.prototype.warn).toHaveBeenCalledWith(
      expect.stringContaining('Rate limit para juan@example.com'),
    );
  });
});

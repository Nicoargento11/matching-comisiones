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

// ─── Test suite ───────────────────────────────────────────────────────────────

describe('EmailObserver', () => {
  let observer: EmailObserver;
  let emailService: jest.Mocked<EmailService>;
  let pdfService: jest.Mocked<ComprobantePdfService>;

  beforeEach(async () => {
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
          useValue: { generar: jest.fn().mockResolvedValue(Buffer.from('pdf')) },
        },
      ],
    }).compile();

    observer = module.get(EmailObserver);
    emailService = module.get(EmailService);
    pdfService = module.get(ComprobantePdfService);

    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('declara failureMode = best-effort', () => {
    expect(observer.failureMode).toBe('best-effort');
  });

  it('regenera el PDF a partir del payload del evento', async () => {
    await observer.onIntercambioCompletado(buildEvento());

    expect(pdfService.generar).toHaveBeenCalledTimes(1);
    expect(pdfService.generar).toHaveBeenCalledWith(
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

  it('no propaga si el envío a un profesor falla (try/catch por destinatario)', async () => {
    emailService.enviarNotificacionProfesor.mockRejectedValue(new Error('SMTP down'));

    await expect(observer.onIntercambioCompletado(buildEvento())).resolves.toBeUndefined();
    expect(Logger.prototype.error).toHaveBeenCalled();
  });

  it('retorna void', async () => {
    const resultado = await observer.onIntercambioCompletado(buildEvento());

    expect(resultado).toBeUndefined();
  });
});

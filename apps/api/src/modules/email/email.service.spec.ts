import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import { sendMail } from '../../__mocks__/nodemailer';

const mockDatos = {
  idIntercambio: 1,
  fechaGeneracion: new Date('2026-06-01T12:00:00.000Z'),
  alumnoOfrece: { nombre_usuario: 'Juan', apellido_usuario: 'Pérez', dni: 11111111 },
  comisionOfrece: {
    nombre_comision: 'Comisión A',
    numero_comision: 1,
    profesor: { nombre_usuario: 'Prof', apellido_usuario: 'A' },
  },
  alumnoDestino: { nombre_usuario: 'María', apellido_usuario: 'López', dni: 22222222 },
  comisionDestino: {
    nombre_comision: 'Comisión B',
    numero_comision: 2,
    profesor: { nombre_usuario: 'Prof', apellido_usuario: 'B' },
  },
};

const mockConfig = {
  getOrThrow: jest.fn((key: string) => {
    const valores: Record<string, string> = {
      SMTP_FROM: 'noreply@test.com',
      SMTP_HOST: 'smtp.test.com',
      SMTP_USER: 'user',
      SMTP_PASSWORD: 'pass',
    };
    if (key in valores) return valores[key];
    throw new Error(`Variable de entorno faltante: ${key}`);
  }),
  get: jest.fn((key: string) => {
    if (key === 'SMTP_PORT') return 587;
    if (key === 'SMTP_SECURE') return 'false';
    return undefined;
  }),
};

describe('EmailService', () => {
  let service: EmailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    (sendMail as jest.Mock).mockReset();
  });

  describe('enviarComprobanteAlumno', () => {
    it('debe llamar a sendMail con el destinatario correcto y adjunto PDF', async () => {
      const pdf = Buffer.from('fake-pdf');
      (sendMail as jest.Mock).mockResolvedValue({ messageId: '1' });

      await service.enviarComprobanteAlumno('alumno@test.com', mockDatos as any, pdf);

      expect(sendMail).toHaveBeenCalledTimes(1);
      const args = (sendMail as jest.Mock).mock.calls[0][0];
      expect(args.to).toBe('alumno@test.com');
      expect(args.subject).toBe('Comprobante de cambio de comisión');
      expect(args.attachments).toHaveLength(1);
      expect(args.attachments[0].content).toBe(pdf);
    });

    it('debe incluir el número de intercambio en el cuerpo del email', async () => {
      (sendMail as jest.Mock).mockResolvedValue({ messageId: '1' });

      await service.enviarComprobanteAlumno('alumno@test.com', mockDatos as any, Buffer.from('pdf'));

      const args = (sendMail as jest.Mock).mock.calls[0][0];
      expect(args.html).toContain('#1');
    });

    it('debe propagar el error cuando sendMail falla', async () => {
      (sendMail as jest.Mock).mockRejectedValue(new Error('SMTP no disponible'));

      await expect(
        service.enviarComprobanteAlumno('alumno@test.com', mockDatos as any, Buffer.from('pdf')),
      ).rejects.toThrow('SMTP no disponible');
    });
  });

  describe('enviarNotificacionProfesor', () => {
    it('debe llamar a sendMail con el asunto correcto', async () => {
      (sendMail as jest.Mock).mockResolvedValue({ messageId: '2' });

      await service.enviarNotificacionProfesor('profe@test.com', mockDatos as any);

      expect(sendMail).toHaveBeenCalledTimes(1);
      const args = (sendMail as jest.Mock).mock.calls[0][0];
      expect(args.to).toBe('profe@test.com');
      expect(args.subject).toBe('Intercambio de alumnos en tu comisión');
    });

    it('debe incluir los nombres de ambas comisiones en el cuerpo', async () => {
      (sendMail as jest.Mock).mockResolvedValue({ messageId: '2' });

      await service.enviarNotificacionProfesor('profe@test.com', mockDatos as any);

      const args = (sendMail as jest.Mock).mock.calls[0][0];
      expect(args.html).toContain('Comisión A');
      expect(args.html).toContain('Comisión B');
    });

    it('usa fallback con número para comisionOfrece cuando nombre_comision es null', async () => {
      (sendMail as jest.Mock).mockResolvedValue({ messageId: '3' });
      const datosConNull = {
        ...mockDatos,
        comisionOfrece: { ...mockDatos.comisionOfrece, nombre_comision: null, numero_comision: 5 },
      };

      await service.enviarNotificacionProfesor('profe@test.com', datosConNull as any);

      const args = (sendMail as jest.Mock).mock.calls[0][0];
      expect(args.html).toContain('Comisión 5');
    });

    it('usa fallback con número para comisionDestino cuando nombre_comision es null', async () => {
      (sendMail as jest.Mock).mockResolvedValue({ messageId: '4' });
      const datosConNull = {
        ...mockDatos,
        comisionDestino: { ...mockDatos.comisionDestino, nombre_comision: null, numero_comision: 7 },
      };

      await service.enviarNotificacionProfesor('profe@test.com', datosConNull as any);

      const args = (sendMail as jest.Mock).mock.calls[0][0];
      expect(args.html).toContain('Comisión 7');
    });

    it('usa "Comisión" como fallback cuando nombre_comision y numero_comision son ambos null', async () => {
      (sendMail as jest.Mock).mockResolvedValue({ messageId: '5' });
      const datosConNull = {
        ...mockDatos,
        comisionOfrece: { ...mockDatos.comisionOfrece, nombre_comision: null, numero_comision: null },
        comisionDestino: { ...mockDatos.comisionDestino, nombre_comision: null, numero_comision: null },
      };

      await service.enviarNotificacionProfesor('profe@test.com', datosConNull as any);

      const args = (sendMail as jest.Mock).mock.calls[0][0];
      expect(args.to).toBe('profe@test.com');
      expect(args.html).toContain('<em>Comisión</em>');
    });

    it('debe propagar el error cuando sendMail falla', async () => {
      (sendMail as jest.Mock).mockRejectedValue(new Error('Timeout SMTP'));

      await expect(
        service.enviarNotificacionProfesor('profe@test.com', mockDatos as any),
      ).rejects.toThrow('Timeout SMTP');
    });
  });

  describe('SMTP_PORT usa el default 587 cuando no está configurado', () => {
    it('instancia el servicio correctamente cuando SMTP_PORT es undefined', async () => {
      const module = await Test.createTestingModule({
        providers: [
          EmailService,
          {
            provide: ConfigService,
            useValue: {
              getOrThrow: jest.fn((key: string) => {
                const map: Record<string, string> = {
                  SMTP_FROM: 'noreply@test.com',
                  SMTP_HOST: 'smtp.test.com',
                  SMTP_USER: 'user',
                  SMTP_PASSWORD: 'pass',
                };
                return map[key];
              }),
              get: jest.fn(() => undefined),
            },
          },
        ],
      }).compile();

      expect(module.get<EmailService>(EmailService)).toBeDefined();
    });
  });
});

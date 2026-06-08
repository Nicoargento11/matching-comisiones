import { Test, TestingModule } from '@nestjs/testing';
import { ComprobanteObserver } from './comprobante.observer';
import { ComprobantePdfService } from '../services/comprobante-pdf.service';
import { ComprobantesStorageService } from '../services/comprobantes-storage.service';
import { ComprobantesRepository } from '../repositories/comprobantes.repository';
import { IntercambioCompletadoEvent } from '../../intercambios/events/intercambio-completado.event';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function buildEvento(): IntercambioCompletadoEvent {
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
        profesor: { id_usuario: 10, nombre_usuario: 'Profe', apellido_usuario: 'A', correo: 'profe.a@example.com' },
      },
    },
    destino: {
      usuario: { id_usuario: 2, nombre_usuario: 'María', apellido_usuario: 'López', dni: 22222222, correo: 'maria@example.com' },
      comision: {
        id_comision: 200,
        nombre_comision: 'Comisión B',
        numero_comision: 2,
        profesor: { id_usuario: 20, nombre_usuario: 'Profe', apellido_usuario: 'B', correo: 'profe.b@example.com' },
      },
    },
  };
}

// ─── Test suite ───────────────────────────────────────────────────────────────

describe('ComprobanteObserver', () => {
  let observer: ComprobanteObserver;
  let pdfService: jest.Mocked<ComprobantePdfService>;
  let storageService: jest.Mocked<ComprobantesStorageService>;
  let comprobantesRepo: jest.Mocked<ComprobantesRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComprobanteObserver,
        { provide: ComprobantePdfService, useValue: { generar: jest.fn().mockResolvedValue(Buffer.from('pdf')) } },
        { provide: ComprobantesStorageService, useValue: { subir: jest.fn().mockResolvedValue('https://cdn.example.com/10.pdf') } },
        { provide: ComprobantesRepository, useValue: { crearComprobante: jest.fn().mockResolvedValue({ id_comprobante: 1 }) } },
      ],
    }).compile();

    observer = module.get(ComprobanteObserver);
    pdfService = module.get(ComprobantePdfService);
    storageService = module.get(ComprobantesStorageService);
    comprobantesRepo = module.get(ComprobantesRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('declara failureMode = critical', () => {
    expect(observer.failureMode).toBe('critical');
  });

  it('construye DatosComprobante desde el payload del evento (sin re-fetch) y genera→sube→persiste', async () => {
    const evento = buildEvento();

    await observer.onIntercambioCompletado(evento);

    expect(pdfService.generar).toHaveBeenCalledWith(
      expect.objectContaining({
        idIntercambio: 10,
        fechaGeneracion: evento.completadoEn,
        alumnoOfrece: expect.objectContaining({ nombre_usuario: 'Juan', dni: 11111111 }),
        comisionOfrece: expect.objectContaining({ nombre_comision: 'Comisión A' }),
        alumnoDestino: expect.objectContaining({ nombre_usuario: 'María', dni: 22222222 }),
        comisionDestino: expect.objectContaining({ nombre_comision: 'Comisión B' }),
      }),
    );
    expect(storageService.subir).toHaveBeenCalledWith(10, expect.any(Buffer));
    expect(comprobantesRepo.crearComprobante).toHaveBeenCalledWith(10, 'https://cdn.example.com/10.pdf');
  });

  it('retorna { comprobanteUrl } con la URL pública persistida', async () => {
    const resultado = await observer.onIntercambioCompletado(buildEvento());

    expect(resultado).toEqual({ comprobanteUrl: 'https://cdn.example.com/10.pdf' });
  });

  it('propaga si la generación del PDF falla', async () => {
    pdfService.generar.mockRejectedValue(new Error('PDF generation failed'));

    await expect(observer.onIntercambioCompletado(buildEvento())).rejects.toThrow('PDF generation failed');
    expect(storageService.subir).not.toHaveBeenCalled();
  });

  it('propaga si la subida a storage falla y no persiste el comprobante', async () => {
    storageService.subir.mockRejectedValue(new Error('Storage unavailable'));

    await expect(observer.onIntercambioCompletado(buildEvento())).rejects.toThrow('Storage unavailable');
    expect(comprobantesRepo.crearComprobante).not.toHaveBeenCalled();
  });

  it('propaga si la persistencia del comprobante falla', async () => {
    comprobantesRepo.crearComprobante.mockRejectedValue(new Error('Unique constraint violation'));

    await expect(observer.onIntercambioCompletado(buildEvento())).rejects.toThrow('Unique constraint violation');
  });
});

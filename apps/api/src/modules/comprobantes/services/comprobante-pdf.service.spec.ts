import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ComprobantePdfService } from './comprobante-pdf.service';
import { DatosComprobante } from '../comprobante.template';

// Mock puppeteer-core at module level
jest.mock('puppeteer-core', () => ({
  __esModule: true,
  default: {
    launch: jest.fn(),
  },
}));

import puppeteer from 'puppeteer-core';

const datosMock: DatosComprobante = {
  idIntercambio: 1,
  fechaGeneracion: new Date(),
  alumnoOfrece: { nombre_usuario: 'A', apellido_usuario: 'B', dni: 1 },
  comisionOfrece: {
    nombre_comision: 'C1',
    numero_comision: 1,
    profesor: { nombre_usuario: 'P1', apellido_usuario: 'P1L' },
  },
  alumnoDestino: { nombre_usuario: 'C', apellido_usuario: 'D', dni: 2 },
  comisionDestino: {
    nombre_comision: 'C2',
    numero_comision: 2,
    profesor: { nombre_usuario: 'P2', apellido_usuario: 'P2L' },
  },
};

describe('ComprobantePdfService', () => {
  let service: ComprobantePdfService;
  const mockLaunch = puppeteer.launch as jest.Mock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComprobantePdfService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue('/usr/bin/chromium'),
          },
        },
      ],
    }).compile();

    service = module.get<ComprobantePdfService>(ComprobantePdfService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns a Buffer when puppeteer succeeds', async () => {
    const mockPage = {
      setContent: jest.fn().mockResolvedValue(undefined),
      pdf: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
    };
    const mockBrowser = {
      newPage: jest.fn().mockResolvedValue(mockPage),
      close: jest.fn().mockResolvedValue(undefined),
    };
    mockLaunch.mockResolvedValue(mockBrowser);

    const result = await service.generarPdf(datosMock);

    expect(result).toBeInstanceOf(Buffer);
    expect(mockBrowser.close).toHaveBeenCalled();
  });

  it('propagates error when puppeteer launch throws', async () => {
    mockLaunch.mockRejectedValue(new Error('Chrome not found'));

    await expect(service.generarPdf(datosMock)).rejects.toThrow('Chrome not found');
  });

  it('propagates error when page.pdf throws', async () => {
    const mockPage = {
      setContent: jest.fn().mockResolvedValue(undefined),
      pdf: jest.fn().mockRejectedValue(new Error('PDF generation failed')),
    };
    const mockBrowser = {
      newPage: jest.fn().mockResolvedValue(mockPage),
      close: jest.fn().mockResolvedValue(undefined),
    };
    mockLaunch.mockResolvedValue(mockBrowser);

    await expect(service.generarPdf(datosMock)).rejects.toThrow('PDF generation failed');
    // browser.close must still be called (finally block)
    expect(mockBrowser.close).toHaveBeenCalled();
  });
});

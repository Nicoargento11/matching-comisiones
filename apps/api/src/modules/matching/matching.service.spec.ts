import { Test, TestingModule } from '@nestjs/testing';
import { MatchingService } from './matching.service';
import { IntercambiosService } from '../intercambios/intercambios.service';
import { SimularMatchingDto } from './dto/simular-matching.dto';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const buildDto = (): SimularMatchingDto => ({
  usuarioSolicitanteId: 1,
  usuarioReceptorId: 2,
  comisionOrigenId: 100,
  comisionDestinoId: 200,
});

const buildIntercambioCreado = () => ({
  id_intercambio: 10,
  fecha_solicitud: '2026-01-01T00:00:00.000Z',
  estado: { id_estado: 1, nombre_estado: 'PENDIENTE' },
  ofrece: {
    usuario: { id_usuario: 1, nombre_usuario: 'Juan', apellido_usuario: 'Pérez' },
    comision: { id_comision: 100, numero_comision: 1, nombre_comision: 'Comisión A' },
  },
  destino: {
    usuario: { id_usuario: 2, nombre_usuario: 'María', apellido_usuario: 'López' },
    comision: { id_comision: 200, numero_comision: 2, nombre_comision: 'Comisión B' },
  },
});

const buildCompletarResultado = () => ({
  id_intercambio: 10,
  comprobante_url: 'https://cdn.example.com/comprobantes/10.pdf',
});

// ─── Test suite ───────────────────────────────────────────────────────────────

describe('MatchingService', () => {
  let service: MatchingService;
  let intercambiosService: jest.Mocked<IntercambiosService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchingService,
        {
          provide: IntercambiosService,
          useValue: {
            crearIntercambio: jest.fn(),
            completar: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(MatchingService);
    intercambiosService = module.get(IntercambiosService);

    intercambiosService.crearIntercambio.mockResolvedValue(buildIntercambioCreado() as any);
    intercambiosService.completar.mockResolvedValue(buildCompletarResultado() as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('simularMatching', () => {
    it('crea un Intercambio real remapeando los campos del DTO de simulación a CreateIntercambioDto', async () => {
      await service.simularMatching(buildDto());

      expect(intercambiosService.crearIntercambio).toHaveBeenCalledWith({
        id_usuario_ofrece: 1,
        id_comision_ofrece: 100,
        id_usuario_destino: 2,
        id_comision_destino: 200,
      });
    });

    it('completa el intercambio recién creado usando su id_intercambio real', async () => {
      await service.simularMatching(buildDto());

      expect(intercambiosService.completar).toHaveBeenCalledWith(10);
    });

    it('llama a crearIntercambio antes que a completar (orden de ejecución)', async () => {
      const orden: string[] = [];
      intercambiosService.crearIntercambio.mockImplementation(async () => {
        orden.push('crearIntercambio');
        return buildIntercambioCreado() as any;
      });
      intercambiosService.completar.mockImplementation(async () => {
        orden.push('completar');
        return buildCompletarResultado() as any;
      });

      await service.simularMatching(buildDto());

      expect(orden).toEqual(['crearIntercambio', 'completar']);
    });

    it('retorna un SimularMatchingResponseDto con id_intercambio, estado, comprobante_url y mensaje', async () => {
      const resultado = await service.simularMatching(buildDto());

      expect(resultado).toEqual({
        id_intercambio: 10,
        estado: 'COMPLETADO',
        comprobante_url: 'https://cdn.example.com/comprobantes/10.pdf',
        mensaje: 'Matching simulado correctamente',
      });
    });

    it('ya no genera un intercambioId sintético con Date.now() — usa el id_intercambio real', async () => {
      intercambiosService.crearIntercambio.mockResolvedValue({
        ...buildIntercambioCreado(),
        id_intercambio: 999,
      } as any);
      intercambiosService.completar.mockResolvedValue({
        id_intercambio: 999,
        comprobante_url: 'https://cdn.example.com/comprobantes/999.pdf',
      } as any);

      const resultado = await service.simularMatching(buildDto());

      expect(resultado.id_intercambio).toBe(999);
      expect(intercambiosService.completar).toHaveBeenCalledWith(999);
    });

    it('propaga el error si crearIntercambio falla, sin llamar a completar', async () => {
      intercambiosService.crearIntercambio.mockRejectedValue(new Error('Inscripciones inactivas'));

      await expect(service.simularMatching(buildDto())).rejects.toThrow('Inscripciones inactivas');
      expect(intercambiosService.completar).not.toHaveBeenCalled();
    });

    it('propaga el error si completar falla', async () => {
      intercambiosService.completar.mockRejectedValue(new Error('Storage unavailable'));

      await expect(service.simularMatching(buildDto())).rejects.toThrow('Storage unavailable');
    });
  });
});

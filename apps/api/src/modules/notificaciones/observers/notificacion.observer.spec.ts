import { Test, TestingModule } from '@nestjs/testing';
import { TipoNotificacion } from '@prisma/client';
import { NotificacionObserver } from './notificacion.observer';
import { NotificacionesRepository } from '../repositories/notificaciones.repository';
import { IntercambioCompletadoEvent } from '../../intercambios/events/intercambio-completado.event';

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

describe('NotificacionObserver', () => {
  let observer: NotificacionObserver;
  let notificacionesRepo: jest.Mocked<NotificacionesRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificacionObserver,
        {
          provide: NotificacionesRepository,
          useValue: { crearNotificacion: jest.fn().mockResolvedValue({ id_notificacion: 1 }) },
        },
      ],
    }).compile();

    observer = module.get(NotificacionObserver);
    notificacionesRepo = module.get(NotificacionesRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('declara failureMode = best-effort', () => {
    expect(observer.failureMode).toBe('best-effort');
  });

  it('persiste 4 notificaciones deduplicadas por id_usuario cuando los profesores son distintos', async () => {
    await observer.onIntercambioCompletado(buildEvento(false));

    expect(notificacionesRepo.crearNotificacion).toHaveBeenCalledTimes(4);
  });

  it('dedupea por id_usuario cuando ambas comisiones comparten el mismo profesor (3 notificaciones)', async () => {
    await observer.onIntercambioCompletado(buildEvento(true));

    expect(notificacionesRepo.crearNotificacion).toHaveBeenCalledTimes(3);
  });

  it('persiste 2 notificaciones MATCHING_COMISION para los alumnos intercambiados', async () => {
    await observer.onIntercambioCompletado(buildEvento(false));

    const llamadas = notificacionesRepo.crearNotificacion.mock.calls.map(([data]) => data);
    const matching = llamadas.filter((d) => d.tipo === TipoNotificacion.MATCHING_COMISION);

    expect(matching).toHaveLength(2);
    expect(matching.map((d) => d.id_usuario).sort()).toEqual([1, 2]);
  });

  it('persiste notificaciones INTERCAMBIO_EN_COMISION para los profesores involucrados', async () => {
    await observer.onIntercambioCompletado(buildEvento(false));

    const llamadas = notificacionesRepo.crearNotificacion.mock.calls.map(([data]) => data);
    const profesores = llamadas.filter((d) => d.tipo === TipoNotificacion.INTERCAMBIO_EN_COMISION);

    expect(profesores).toHaveLength(2);
    expect(profesores.map((d) => d.id_usuario).sort()).toEqual([10, 20]);
  });

  it('retorna void', async () => {
    const resultado = await observer.onIntercambioCompletado(buildEvento(false));

    expect(resultado).toBeUndefined();
  });

  it('usa el fallback "Comisión {numero}" en el mensaje cuando nombre_comision es null en ambas comisiones', async () => {
    const evento = buildEvento(false);
    const conNulos: IntercambioCompletadoEvent = {
      ...evento,
      ofrece: { ...evento.ofrece, comision: { ...evento.ofrece.comision, nombre_comision: null } },
      destino: { ...evento.destino, comision: { ...evento.destino.comision, nombre_comision: null } },
    };

    await observer.onIntercambioCompletado(conNulos);

    const llamadas = notificacionesRepo.crearNotificacion.mock.calls.map(([data]) => data);
    const profesores = llamadas.filter((d) => d.tipo === TipoNotificacion.INTERCAMBIO_EN_COMISION);

    expect(profesores).toHaveLength(2);
    expect(profesores[0].mensaje).toContain(`Comisión ${conNulos.destino.comision.numero_comision}`);
    expect(profesores[1].mensaje).toContain(`Comisión ${conNulos.ofrece.comision.numero_comision}`);
  });
});

import { Logger } from '@nestjs/common';
import { IntercambioCompletadoSubject } from './intercambio-completado.subject';
import { IIntercambioObserver, ObserverResultado } from './intercambio-observer.interface';
import { IntercambioCompletadoEvent } from '../events/intercambio-completado.event';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function buildEvento(): IntercambioCompletadoEvent {
  return {
    id_intercambio: 10,
    id_comision_ofrece: 100,
    id_comision_destino: 200,
    completadoEn: new Date('2026-01-01T00:00:00.000Z'),
    ofrece: {
      usuario: { id_usuario: 1, nombre_usuario: 'Juan', apellido_usuario: 'Pérez', dni: 1, correo: 'a@a.com' },
      comision: {
        id_comision: 100,
        nombre_comision: 'A',
        numero_comision: 1,
        profesor: { id_usuario: 10, nombre_usuario: 'Profe', apellido_usuario: 'A', correo: 'pa@a.com' },
      },
    },
    destino: {
      usuario: { id_usuario: 2, nombre_usuario: 'María', apellido_usuario: 'López', dni: 2, correo: 'b@b.com' },
      comision: {
        id_comision: 200,
        nombre_comision: 'B',
        numero_comision: 2,
        profesor: { id_usuario: 20, nombre_usuario: 'Profe', apellido_usuario: 'B', correo: 'pb@b.com' },
      },
    },
  };
}

function buildObserver(
  failureMode: 'critical' | 'best-effort',
  impl: (evento: IntercambioCompletadoEvent) => Promise<ObserverResultado | void>,
): IIntercambioObserver {
  return { failureMode, onIntercambioCompletado: jest.fn(impl) };
}

// ─── Test suite ───────────────────────────────────────────────────────────────

describe('IntercambioCompletadoSubject', () => {
  let subject: IntercambioCompletadoSubject;

  beforeEach(() => {
    subject = new IntercambioCompletadoSubject();
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('ejecuta los observers críticos secuencialmente y propaga si uno lanza', async () => {
    const orden: string[] = [];
    const critico1 = buildObserver('critical', async () => {
      orden.push('critico1');
      return { comprobanteUrl: 'https://cdn.example.com/1.pdf' };
    });
    const critico2 = buildObserver('critical', async () => {
      orden.push('critico2');
      throw new Error('fallo crítico');
    });

    subject.registrarObserver(critico1);
    subject.registrarObserver(critico2);

    await expect(subject.notificar(buildEvento())).rejects.toThrow('fallo crítico');
    expect(orden).toEqual(['critico1', 'critico2']);
  });

  it('ejecuta los observers best-effort vía allSettled, nunca propaga, y logea cada rechazo', async () => {
    const critico = buildObserver('critical', async () => ({ comprobanteUrl: 'https://cdn.example.com/1.pdf' }));
    const bestEffortOk = buildObserver('best-effort', async () => undefined);
    const bestEffortFalla = buildObserver('best-effort', async () => {
      throw new Error('fallo best-effort');
    });

    subject.registrarObserver(critico);
    subject.registrarObserver(bestEffortOk);
    subject.registrarObserver(bestEffortFalla);

    await expect(subject.notificar(buildEvento())).resolves.toEqual({
      comprobanteUrl: 'https://cdn.example.com/1.pdf',
    });
    expect(bestEffortOk.onIntercambioCompletado).toHaveBeenCalled();
    expect(bestEffortFalla.onIntercambioCompletado).toHaveBeenCalled();
    expect(Logger.prototype.error).toHaveBeenCalledWith(
      expect.stringContaining('falló'),
      expect.any(Error),
    );
  });

  it('notificar retorna { comprobanteUrl } extraído del observer crítico', async () => {
    const critico = buildObserver('critical', async () => ({ comprobanteUrl: 'https://cdn.example.com/url-final.pdf' }));
    subject.registrarObserver(critico);

    const resultado = await subject.notificar(buildEvento());

    expect(resultado).toEqual({ comprobanteUrl: 'https://cdn.example.com/url-final.pdf' });
  });

  it('lanza un error si ningún observer crítico produce comprobanteUrl', async () => {
    const criticoSinUrl = buildObserver('critical', async () => undefined);
    subject.registrarObserver(criticoSinUrl);

    await expect(subject.notificar(buildEvento())).rejects.toThrow();
  });

  it('corre todos los observers críticos antes que los best-effort', async () => {
    const orden: string[] = [];
    const critico = buildObserver('critical', async () => {
      orden.push('critical');
      return { comprobanteUrl: 'https://cdn.example.com/1.pdf' };
    });
    const bestEffort = buildObserver('best-effort', async () => {
      orden.push('best-effort');
    });

    // Registramos best-effort primero para probar que el ORDEN DE EJECUCIÓN
    // depende de la clasificación, no del orden de registro.
    subject.registrarObserver(bestEffort);
    subject.registrarObserver(critico);

    await subject.notificar(buildEvento());

    expect(orden).toEqual(['critical', 'best-effort']);
  });
});

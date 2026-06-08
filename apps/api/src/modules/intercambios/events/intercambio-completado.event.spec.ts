import { IntercambioCompletadoEvent } from './intercambio-completado.event';

// ─── Fixture builder ──────────────────────────────────────────────────────────

function buildEvento(): IntercambioCompletadoEvent {
  return {
    id_intercambio: 10,
    id_comision_ofrece: 100,
    id_comision_destino: 200,
    completadoEn: new Date('2026-01-01T00:00:00.000Z'),
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
          id_usuario: 10,
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
          id_usuario: 20,
          nombre_usuario: 'Profe',
          apellido_usuario: 'B',
          correo: 'profe.b@example.com',
        },
      },
    },
  };
}

// ─── Test suite ───────────────────────────────────────────────────────────────

describe('IntercambioCompletadoEvent', () => {
  it('acepta un payload completo que mira al shape de obtenerDatosCompletos (ofrece/destino con usuario+comisión+profesor)', () => {
    const evento = buildEvento();

    expect(evento.id_intercambio).toBe(10);
    expect(evento.id_comision_ofrece).toBe(100);
    expect(evento.id_comision_destino).toBe(200);
    expect(evento.completadoEn).toBeInstanceOf(Date);

    expect(evento.ofrece.usuario.id_usuario).toBe(1);
    expect(evento.ofrece.usuario.dni).toBe(11111111);
    expect(evento.ofrece.usuario.correo).toBe('juan@example.com');
    expect(evento.ofrece.comision.profesor.correo).toBe('profe.a@example.com');

    expect(evento.destino.usuario.id_usuario).toBe(2);
    expect(evento.destino.comision.profesor.id_usuario).toBe(20);
  });

  it('no incluye id_estado (no se necesita post-transacción)', () => {
    const evento: unknown = buildEvento();

    expect((evento as { id_estado?: unknown }).id_estado).toBeUndefined();
  });

  it('admite nombre_comision y numero_comision nulos (fallback de nombre)', () => {
    const evento = buildEvento();
    const conNulos: IntercambioCompletadoEvent = {
      ...evento,
      ofrece: {
        ...evento.ofrece,
        comision: { ...evento.ofrece.comision, nombre_comision: null, numero_comision: null },
      },
    };

    expect(conNulos.ofrece.comision.nombre_comision).toBeNull();
    expect(conNulos.ofrece.comision.numero_comision).toBeNull();
  });
});

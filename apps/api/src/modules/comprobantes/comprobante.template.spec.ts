import { construirHtmlComprobante, DatosComprobante } from './comprobante.template';

const datosMock: DatosComprobante = {
  idIntercambio: 42,
  fechaGeneracion: new Date('2026-06-03T12:00:00Z'),
  alumnoOfrece: {
    nombre_usuario: 'Juan',
    apellido_usuario: 'Pérez',
    dni: 12345678,
  },
  comisionOfrece: {
    nombre_comision: 'Comisión A',
    numero_comision: 1,
    profesor: {
      nombre_usuario: 'Carlos',
      apellido_usuario: 'García',
    },
  },
  alumnoDestino: {
    nombre_usuario: 'María',
    apellido_usuario: 'López',
    dni: 87654321,
  },
  comisionDestino: {
    nombre_comision: 'Comisión B',
    numero_comision: 2,
    profesor: {
      nombre_usuario: 'Ana',
      apellido_usuario: 'Martínez',
    },
  },
};

describe('construirHtmlComprobante', () => {
  let html: string;

  beforeEach(() => {
    html = construirHtmlComprobante(datosMock);
  });

  it('contains the intercambio ID', () => {
    expect(html).toContain('42');
  });

  it('contains alumnoOfrece full name', () => {
    expect(html).toContain('Juan');
    expect(html).toContain('Pérez');
  });

  it('contains alumnoOfrece DNI', () => {
    expect(html).toContain('12345678');
  });

  it('contains alumnoDestino full name', () => {
    expect(html).toContain('María');
    expect(html).toContain('López');
  });

  it('contains alumnoDestino DNI', () => {
    expect(html).toContain('87654321');
  });

  it('contains comision names', () => {
    expect(html).toContain('Comisión A');
    expect(html).toContain('Comisión B');
  });

  it('contains professor names', () => {
    expect(html).toContain('Carlos');
    expect(html).toContain('García');
    expect(html).toContain('Ana');
    expect(html).toContain('Martínez');
  });

  it('falls back to numero_comision when nombre_comision is null', () => {
    const datosConNull: DatosComprobante = {
      ...datosMock,
      comisionOfrece: { ...datosMock.comisionOfrece, nombre_comision: null },
    };
    const result = construirHtmlComprobante(datosConNull);
    expect(result).toContain('Comisión 1');
  });

  it('falls back to "Comisión" when both nombre_comision and numero_comision are null', () => {
    const datosConNull: DatosComprobante = {
      ...datosMock,
      comisionOfrece: { ...datosMock.comisionOfrece, nombre_comision: null, numero_comision: null },
      comisionDestino: { ...datosMock.comisionDestino, nombre_comision: null, numero_comision: null },
    };
    const result = construirHtmlComprobante(datosConNull);
    expect(result).toContain('Comisión');
  });
});

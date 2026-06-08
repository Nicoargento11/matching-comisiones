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

  // ── Metadata ──

  it('contains the intercambio ID', () => {
    expect(html).toContain('42');
  });

  it('contains the generation date in AR format', () => {
    expect(html).toContain('03/06/2026');
  });

  // ── Student names and DNIs ──

  it('shows alumnoOfrece full name in the section header', () => {
    expect(html).toContain('Juan');
    expect(html).toContain('Pérez');
  });

  it('shows alumnoOfrece DNI in the section header', () => {
    expect(html).toContain('12345678');
  });

  it('shows alumnoDestino full name in the section header', () => {
    expect(html).toContain('María');
    expect(html).toContain('López');
  });

  it('shows alumnoDestino DNI in the section header', () => {
    expect(html).toContain('87654321');
  });

  // ── Journey structure ──

  it('shows "Comisión anterior" and "Comisión nueva" labels for each student', () => {
    // Two students × two labels each = 4 occurrences
    const anteriorMatches = (html.match(/Comisión anterior/g) ?? []).length;
    const nuevaMatches = (html.match(/Comisión nueva/g) ?? []).length;
    expect(anteriorMatches).toBe(2);
    expect(nuevaMatches).toBe(2);
  });

  it('shows each commission paired with a "Prof. ..." label', () => {
    expect(html).toContain('Prof. Carlos García');
    expect(html).toContain('Prof. Ana Martínez');
  });

  it('shows the arrow icon between anterior and nueva', () => {
    // Two students → two arrow usages in HTML (not counting the CSS class definition)
    const arrowMatches = (html.match(/class="journey-arrow-icon"/g) ?? []).length;
    expect(arrowMatches).toBe(2);
  });

  // ── Commission names ──

  it('contains both commission names', () => {
    expect(html).toContain('Comisión A');
    expect(html).toContain('Comisión B');
  });

  // ── Professor names ──

  it('contains all professor names', () => {
    expect(html).toContain('Carlos');
    expect(html).toContain('García');
    expect(html).toContain('Ana');
    expect(html).toContain('Martínez');
  });

  // ── Fallbacks for null/undefined commission names ──

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

  // ── Student journey correctness ──

  it('shows Juan Pérez moving from Comisión A (Prof. Carlos) to Comisión B (Prof. Ana)', () => {
    // The first student section should pair alumnoOfrece's current commission
    // with alumnoDestino's commission as the target
    expect(html).toContain('Juan');
    expect(html).toContain('Pérez');
    expect(html).toContain('Comisión A');
    expect(html).toContain('Comisión B');
    expect(html).toContain('Prof. Carlos García');
    expect(html).toContain('Prof. Ana Martínez');
  });

  it('shows María López moving from Comisión B (Prof. Ana) to Comisión A (Prof. Carlos)', () => {
    // The second student section should pair alumnoDestino's current commission
    // with alumnoOfrece's commission as the target
    expect(html).toContain('María');
    expect(html).toContain('López');
    expect(html).toContain('Comisión B');
    expect(html).toContain('Comisión A');
    expect(html).toContain('Prof. Ana Martínez');
    expect(html).toContain('Prof. Carlos García');
  });
});

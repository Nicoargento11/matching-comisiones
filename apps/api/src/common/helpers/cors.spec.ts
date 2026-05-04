import { parsearOrigenCors } from './cors';

describe('parsearOrigenCors', () => {
  it('debe retornar true cuando el valor es *', () => {
    expect(parsearOrigenCors('*')).toBe(true);
  });

  it('debe retornar true cuando el valor está vacío o undefined', () => {
    expect(parsearOrigenCors(undefined)).toBe(true);
    expect(parsearOrigenCors('')).toBe(true);
  });

  it('debe retornar string cuando hay un solo dominio', () => {
    expect(parsearOrigenCors('https://app.example.com')).toBe(
      'https://app.example.com',
    );
  });

  it('debe retornar array cuando hay múltiples dominios separados por coma', () => {
    const resultado = parsearOrigenCors(
      'https://app.example.com,https://admin.example.com',
    );
    expect(resultado).toEqual([
      'https://app.example.com',
      'https://admin.example.com',
    ]);
  });

  it('debe normalizar espacios alrededor de las comas', () => {
    const resultado = parsearOrigenCors('https://a.com , https://b.com');
    expect(resultado).toEqual(['https://a.com', 'https://b.com']);
  });
});

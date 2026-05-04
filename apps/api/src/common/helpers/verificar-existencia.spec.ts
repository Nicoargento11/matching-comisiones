import { NotFoundException } from '@nestjs/common';
import { verificarOExcepcion } from './verificar-existencia';

describe('verificarOExcepcion', () => {
  it('debe retornar el resultado cuando la búsqueda encuentra el elemento', async () => {
    const mockEntidad = { id_usuario: 5, nombre: 'Juan' };
    const resultado = await verificarOExcepcion(
      () => Promise.resolve(mockEntidad),
      'usuario',
      5,
    );

    expect(resultado).toEqual(mockEntidad);
  });

  it('debe lanzar NotFoundException cuando la búsqueda retorna null', async () => {
    await expect(
      verificarOExcepcion(() => Promise.resolve(null), 'comisión', 99),
    ).rejects.toThrow(NotFoundException);
  });

  it('debe incluir la entidad y el id en el mensaje del error', async () => {
    await expect(
      verificarOExcepcion(() => Promise.resolve(null), 'usuario', 42),
    ).rejects.toThrow('No existe usuario con id=42');
  });

  it('debe funcionar con id de tipo string', async () => {
    await expect(
      verificarOExcepcion(() => Promise.resolve(null), 'registro', 'abc-123'),
    ).rejects.toThrow('No existe registro con id=abc-123');
  });
});

import { construirPaginacion, construirMetaPaginacion } from './paginacion';
import { PaginacionDto } from '../dto/paginacion.dto';

describe('construirPaginacion', () => {
  it('debe retornar skip y take por defecto con pagina=1 y limite=10', () => {
    const dto = new PaginacionDto();
    const result = construirPaginacion(dto);

    expect(result).toEqual({
      skip: 0,
      take: 10,
    });
  });

  it('debe calcular skip correctamente para pagina 3 con limite 5', () => {
    const dto = new PaginacionDto();
    dto.pagina = 3;
    dto.limite = 5;
    const result = construirPaginacion(dto);

    expect(result).toEqual({
      skip: 10,
      take: 5,
    });
  });

  it('debe incluir orderBy cuando el campo está en la whitelist', () => {
    const dto = new PaginacionDto();
    dto.ordenarPor = 'nombre_usuario';
    dto.direccion = 'desc';
    const result = construirPaginacion(dto, [
      'nombre_usuario',
      'apellido_usuario',
    ]);

    expect(result).toEqual({
      skip: 0,
      take: 10,
      orderBy: { nombre_usuario: 'desc' },
    });
  });

  it('debe usar direccion asc por defecto cuando el campo está en whitelist', () => {
    const dto = new PaginacionDto();
    dto.ordenarPor = 'nombre_usuario';
    const result = construirPaginacion(dto, ['nombre_usuario']);

    expect(result.orderBy).toEqual({ nombre_usuario: 'asc' });
  });

  it('debe ignorar ordenarPor si el campo no está en la whitelist', () => {
    const dto = new PaginacionDto();
    dto.ordenarPor = 'campo_arbitrario';
    dto.direccion = 'asc';
    const result = construirPaginacion(dto, ['nombre_usuario', 'correo']);

    expect(result.orderBy).toBeUndefined();
  });

  it('debe ignorar ordenarPor si la whitelist está vacía', () => {
    const dto = new PaginacionDto();
    dto.ordenarPor = 'nombre_usuario';
    const result = construirPaginacion(dto, []);

    expect(result.orderBy).toBeUndefined();
  });

  it('no debe incluir orderBy si ordenarPor no está definido', () => {
    const dto = new PaginacionDto();
    const result = construirPaginacion(dto, ['nombre_usuario']);

    expect(result.orderBy).toBeUndefined();
  });
});

describe('construirMetaPaginacion', () => {
  it('debe calcular totalPaginas correctamente', () => {
    const dto = new PaginacionDto();
    const result = construirMetaPaginacion(25, dto);

    expect(result).toEqual({
      total: 25,
      pagina: 1,
      limite: 10,
      totalPaginas: 3,
    });
  });

  it('debe redondear hacia arriba para totalPaginas', () => {
    const dto = new PaginacionDto();
    const result = construirMetaPaginacion(21, dto);

    expect(result.totalPaginas).toBe(3);
  });

  it('debe retornar 0 totalPaginas cuando no hay registros', () => {
    const dto = new PaginacionDto();
    const result = construirMetaPaginacion(0, dto);

    expect(result.totalPaginas).toBe(0);
  });

  it('debe usar los valores del dto cuando están seteados', () => {
    const dto = new PaginacionDto();
    dto.pagina = 2;
    dto.limite = 5;
    const result = construirMetaPaginacion(12, dto);

    expect(result).toEqual({
      total: 12,
      pagina: 2,
      limite: 5,
      totalPaginas: 3,
    });
  });
});

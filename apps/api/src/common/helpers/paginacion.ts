import { PaginacionDto } from '../dto/paginacion.dto';

/** Parámetros de paginación para Prisma findMany */
export interface PaginacionParams {
  skip: number;
  take: number;
  orderBy?: Record<string, 'asc' | 'desc'>;
}

/**
 * Convierte un PaginacionDto en parámetros de paginación para Prisma findMany.
 * @param dto - DTO de paginación con pagina, limite, ordenarPor y direccion
 * @param camposPermitidos - Whitelist de campos ordenables. Si está vacía, se ignora ordenarPor.
 * @returns Objeto con skip, take y orderBy para pasar a findMany
 */
export function construirPaginacion(
  dto: PaginacionDto,
  camposPermitidos: string[] = [],
): PaginacionParams {
  const pagina = dto.pagina ?? 1;
  const limite = dto.limite ?? 10;

  const params: PaginacionParams = {
    skip: (pagina - 1) * limite,
    take: limite,
  };

  if (dto.ordenarPor && camposPermitidos.includes(dto.ordenarPor)) {
    params.orderBy = {
      [dto.ordenarPor]: dto.direccion ?? 'asc',
    };
  }

  return params;
}

/**
 * Construye el objeto meta para la respuesta paginada
 * @param total - Cantidad total de registros
 * @param dto - DTO de paginación original
 * @returns Objeto meta con total y pagina
 */
export function construirMetaPaginacion(
  total: number,
  dto: PaginacionDto,
): { total: number; pagina: number; limite: number; totalPaginas: number } {
  const pagina = dto.pagina ?? 1;
  const limite = dto.limite ?? 10;
  return {
    total,
    pagina,
    limite,
    totalPaginas: Math.ceil(total / limite),
  };
}

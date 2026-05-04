import { NotFoundException } from '@nestjs/common';

/**
 * Ejecuta una búsqueda y lanza NotFoundException si no encuentra resultado.
 * @param buscar - Función que retorna la entidad o null
 * @param entidad - Nombre de la entidad para el mensaje de error
 * @param id - ID buscado para el mensaje de error
 * @returns La entidad encontrada
 * @throws NotFoundException si buscar() retorna null
 */
export async function verificarOExcepcion<T>(
  buscar: () => Promise<T | null>,
  entidad: string,
  id: number | string,
): Promise<T> {
  const resultado = await buscar();
  if (!resultado) {
    throw new NotFoundException(`No existe ${entidad} con id=${id}`);
  }
  return resultado;
}

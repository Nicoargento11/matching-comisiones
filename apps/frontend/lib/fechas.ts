// Argentina = UTC-3, sin horario de verano desde 1999.
// La DB guarda en UTC, el front convierte al mostrar.

export function utcAHoraArg(isoStr: string): string {
  const d = new Date(isoStr)
  const local = new Date(d.getTime() - 3 * 60 * 60 * 1000)
  return `${String(local.getUTCHours()).padStart(2, '0')}:${String(local.getUTCMinutes()).padStart(2, '0')}`
}

export function utcAFechaArg(isoStr: string): string {
  const d = new Date(isoStr)
  const local = new Date(d.getTime() - 3 * 60 * 60 * 1000)
  return local.toISOString().slice(0, 10)
}

// Retorna un Date a medianoche hora local del browser para comparaciones de rango
export function utcAFechaArgDate(isoStr: string): Date {
  const d = new Date(isoStr)
  const local = new Date(d.getTime() - 3 * 60 * 60 * 1000)
  return new Date(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate())
}

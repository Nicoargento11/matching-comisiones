// Argentina = UTC-3, sin horario de verano desde 1999.
// La DB guarda en UTC, el front convierte al mostrar.

export function formatearHora(ts: string): string {
  return new Date(ts).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
}

export function formatearFechaCorta(ts: string): string {
  const fecha = new Date(ts)
  const hoy = new Date()
  const ayer = new Date(hoy)
  ayer.setDate(hoy.getDate() - 1)
  if (fecha.toDateString() === hoy.toDateString()) return "Hoy"
  if (fecha.toDateString() === ayer.toDateString()) return "Ayer"
  return fecha.toLocaleDateString("es-AR", { day: "numeric", month: "long" })
}

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

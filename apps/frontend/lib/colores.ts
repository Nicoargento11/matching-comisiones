const PALETA = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#3b82f6', '#f97316', '#ec4899',
]

export function colorPorMateria(idMateria: number): string {
  return PALETA[idMateria % PALETA.length]
}

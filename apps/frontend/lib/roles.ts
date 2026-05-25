export function obtenerRol(roles?: { nombre_rol?: string }[]): string | null {
  if (!roles?.length) return null
  if (roles.some((r) => r.nombre_rol === 'profesor')) return 'Profe'
  if (roles.some((r) => r.nombre_rol === 'estudiante')) return 'Alumno'
  return null
}

export function esEstudiante(roles?: { nombre_rol?: string }[]): boolean {
  return roles?.some((r) => r.nombre_rol === 'estudiante') ?? false
}

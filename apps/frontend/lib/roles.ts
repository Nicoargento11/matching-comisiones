// roles con estructura anidada { rol: { nombre_rol } } — viene de /usuarios/dni/:id
export function obtenerRol(roles?: { rol?: { nombre_rol?: string } }[]): string | null {
  if (!roles?.length) return null
  if (roles.some((r) => r.rol?.nombre_rol === 'profesor')) return 'Profe'
  if (roles.some((r) => r.rol?.nombre_rol === 'estudiante')) return 'Alumno'
  return null
}

export function esEstudiante(roles?: { rol?: { nombre_rol?: string } }[]): boolean {
  return roles?.some((r) => r.rol?.nombre_rol === 'estudiante') ?? false
}

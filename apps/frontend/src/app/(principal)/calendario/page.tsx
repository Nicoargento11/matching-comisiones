// vista del calendario del estudiante
// usa Suspense porque ContenidoCalendario necesita useSearchParams
import { Suspense } from 'react'
import ContenidoCalendario from '@/componentes/funcionalidades/ContenidoCalendario'

// esqueleto de carga mientras se resuelve el contenido
function EsqueletoCalendario() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-8 w-48 rounded-lg bg-gray-200 dark:bg-gray-700" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 rounded-xl bg-gray-200 dark:bg-gray-700" />
        ))}
      </div>
    </div>
  )
}

export default function PaginaCalendario() {
  return (
    <Suspense fallback={<EsqueletoCalendario />}>
      <ContenidoCalendario />
    </Suspense>
  )
}

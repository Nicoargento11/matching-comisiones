import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import VistaMensajeria from '@/componentes/funcionalidades/VistaMensajeria'
import BotonVolver from '@/componentes/interfaz/BotonVolver'
import { getServerSession } from '@/lib/supabase-server'

function EsqueletoMensajeria() {
  return (
    <div className="flex h-[calc(100vh-8rem)] animate-pulse overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <div className="w-80 shrink-0 border-r border-gray-100 dark:border-gray-700">
        <div className="space-y-3 p-4">
          <div className="h-8 rounded-lg bg-gray-200 dark:bg-gray-700" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="flex-1 space-y-1">
                <div className="h-3.5 w-24 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-3 w-36 rounded bg-gray-100 dark:bg-gray-800" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800" />
      </div>
    </div>
  )
}

export default async function PaginaMensajes() {
  const session = await getServerSession()
  if (!session) redirect('/login')

  return (
    <div className="space-y-4">
      <BotonVolver />
      <Suspense fallback={<EsqueletoMensajeria />}>
        <VistaMensajeria />
      </Suspense>
    </div>
  )
}

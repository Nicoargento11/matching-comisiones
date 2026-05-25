'use client'

import { useRouter } from 'next/navigation'
import TarjetaNotificacion from '@/componentes/interfaz/TarjetaNotificacion'
import { useNotificaciones } from '@/src/context/NotificacionesContext'

export default function PaginaNotificaciones() {
  const router = useRouter()
  const { notificaciones, noLeidas, cargando, marcarLeida, marcarTodasLeidas } = useNotificaciones()

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            aria-label="Volver"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-indigo-500 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-400"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Notificaciones</h1>
          {noLeidas > 0 && (
            <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-sm font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
              {noLeidas} sin leer
            </span>
          )}
        </div>

        {noLeidas > 0 && (
          <button
            onClick={marcarTodasLeidas}
            className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400 dark:hover:bg-indigo-900/40"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
            </svg>
            Marcar todas como leídas
          </button>
        )}
      </div>

      {cargando ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      ) : notificaciones.length > 0 ? (
        <div className="flex flex-col gap-3">
          {notificaciones.map((notificacion) => (
            <TarjetaNotificacion
              key={notificacion.id_notificacion}
              notificacion={notificacion}
              onMarcarLeida={marcarLeida}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-16 text-center dark:border-gray-600">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="mb-3 h-8 w-8 text-gray-300 dark:text-gray-600" aria-hidden>
            <path d="M4.214 3.227a.75.75 0 0 0-1.156-.956 8.97 8.97 0 0 0-1.856 3.826.75.75 0 0 0 1.466.316 7.47 7.47 0 0 1 1.546-3.186ZM16.942 2.271a.75.75 0 0 0-1.157.956 7.47 7.47 0 0 1 1.547 3.186.75.75 0 0 0 1.466-.316 8.971 8.971 0 0 0-1.856-3.826ZM10 2a6 6 0 0 0-6 6v1.077a.75.75 0 0 1-.063.303L2.62 12.493a1 1 0 0 0 .894 1.507H7.5a2.5 2.5 0 0 0 5 0h4.987a1 1 0 0 0 .894-1.507L17.063 9.38A.75.75 0 0 1 17 9.077V8a6 6 0 0 0-6-6Z" />
          </svg>
          <p className="text-gray-400 dark:text-gray-500">No tenés notificaciones por el momento</p>
        </div>
      )}
    </div>
  )
}

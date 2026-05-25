'use client'

import type { Notificacion } from '@/tipos'
import { tiempoRelativo } from '@/lib/fechas'

interface Props {
  notificacion: Notificacion
  onMarcarLeida: (idNotificacion: number) => void
}

export default function TarjetaNotificacion({ notificacion, onMarcarLeida }: Props) {
  const { id_notificacion, tipo, titulo, mensaje, leida, creada_en } = notificacion

  return (
    <div
      className={`relative flex gap-4 rounded-xl border p-4 transition-colors ${
        leida
          ? 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800/50'
          : 'border-indigo-200 bg-indigo-50/40 dark:border-indigo-800 dark:bg-indigo-900/10'
      }`}
    >
      {!leida && (
        <span className="absolute right-4 top-4 h-2 w-2 rounded-full bg-indigo-500" aria-hidden />
      )}

      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
          tipo === 'MATCHING_COMISION'
            ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
            : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
        }`}
      >
        {tipo === 'MATCHING_COMISION' ? <IconoMatching /> : <IconoSistema />}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={`text-sm font-semibold ${
              leida ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-gray-100'
            }`}
          >
            {titulo}
          </p>
          <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500">
            {tiempoRelativo(creada_en)}
          </span>
        </div>

        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{mensaje}</p>

        {!leida && (
          <button
            onClick={() => onMarcarLeida(id_notificacion)}
            className="mt-2 text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            Marcar como leída
          </button>
        )}
      </div>
    </div>
  )
}

function IconoMatching() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden>
      <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
    </svg>
  )
}

function IconoSistema() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden>
      <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" />
    </svg>
  )
}

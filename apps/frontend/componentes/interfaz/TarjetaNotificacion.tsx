'use client'

import type { Notificacion, TipoNotificacion } from '@/tipos'
import { tiempoRelativo } from '@/lib/fechas'

interface Props {
  notificacion: Notificacion
  onMarcarLeida: (idNotificacion: number) => void
}

type ConfigTipo = {
  claseBurbuja: string
  claseTarjetaNoLeida: string
  colorPunto: string
  icono: React.ReactNode
  etiqueta?: string
}

function configPorTipo(tipo: TipoNotificacion): ConfigTipo {
  switch (tipo) {
    case 'MATCHING_COMISION':
      return {
        claseBurbuja: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
        claseTarjetaNoLeida: 'border-indigo-200 bg-indigo-50/40 dark:border-indigo-800 dark:bg-indigo-900/10',
        colorPunto: 'bg-indigo-500',
        icono: <IconoMatchingAlumno />,
      }
    case 'MATCHING_PROFESOR':
      return {
        claseBurbuja: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
        claseTarjetaNoLeida: 'border-indigo-200 bg-indigo-50/40 dark:border-indigo-800 dark:bg-indigo-900/10',
        colorPunto: 'bg-indigo-500',
        icono: <IconoMatchingProfesor />,
      }
    case 'TRASLADO_MANUAL_PROFESOR':
      return {
        claseBurbuja: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        claseTarjetaNoLeida: 'border-amber-200 bg-amber-50/40 dark:border-amber-800 dark:bg-amber-900/10',
        colorPunto: 'bg-amber-500',
        icono: <IconoTrasladoManual />,
        etiqueta: 'Cambio manual',
      }
    default:
      return {
        claseBurbuja: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
        claseTarjetaNoLeida: 'border-indigo-200 bg-indigo-50/40 dark:border-indigo-800 dark:bg-indigo-900/10',
        colorPunto: 'bg-indigo-500',
        icono: <IconoSistema />,
      }
  }
}

export default function TarjetaNotificacion({ notificacion, onMarcarLeida }: Props) {
  const { id_notificacion, tipo, titulo, mensaje, leida, creada_en } = notificacion
  const config = configPorTipo(tipo)

  return (
    <div
      className={`relative flex gap-4 rounded-xl border p-4 transition-colors ${
        leida
          ? 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800/50'
          : config.claseTarjetaNoLeida
      }`}
    >
      {!leida && (
        <span
          className={`absolute right-4 top-4 h-2 w-2 rounded-full ${config.colorPunto}`}
          aria-hidden
        />
      )}

      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${config.claseBurbuja}`}
      >
        {config.icono}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p
                className={`text-sm font-semibold ${
                  leida ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-gray-100'
                }`}
              >
                {titulo}
              </p>
              {config.etiqueta && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  {config.etiqueta}
                </span>
              )}
            </div>
          </div>
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

// Alumno: matching completado exitosamente (checkmark)
function IconoMatchingAlumno() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden>
      <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
    </svg>
  )
}

// Profesor: ocurrió un intercambio en su comisión (flechas circulares = swap)
function IconoMatchingProfesor() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden>
      <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H3.989a.75.75 0 0 0-.75.75v4.242a.75.75 0 0 0 1.5 0v-2.43l.31.31a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.449-.39Zm1.23-3.723a.75.75 0 0 0 .219-.53V2.929a.75.75 0 0 0-1.5 0V5.36l-.31-.31A7 7 0 0 0 3.239 8.188a.75.75 0 1 0 1.448.389A5.5 5.5 0 0 1 13.89 6.11l.311.31h-2.432a.75.75 0 0 0 0 1.5h4.243a.75.75 0 0 0 .53-.219Z" clipRule="evenodd" />
    </svg>
  )
}

// Profesor: un alumno fue trasladado manualmente desde su comisión (triángulo de alerta)
function IconoTrasladoManual() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden>
      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
    </svg>
  )
}

// Sistema: información general (círculo de info)
function IconoSistema() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden>
      <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" />
    </svg>
  )
}

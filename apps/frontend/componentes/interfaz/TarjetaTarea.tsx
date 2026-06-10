'use client'

import { useState } from 'react'
import type { TareaTablero } from '@/tipos'

const COLORES_PRIORIDAD: Record<TareaTablero['prioridad'], string> = {
  BAJA: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  MEDIA: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  ALTA: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const LABELS_PRIORIDAD: Record<TareaTablero['prioridad'], string> = {
  BAJA: 'Baja',
  MEDIA: 'Media',
  ALTA: 'Alta',
}

const LABELS_TIPO_EVENTO: Record<string, string> = {
  CLASE: 'Clase',
  PARCIAL: 'Parcial',
  ENTREGA_TP: 'Entrega TP',
  OTRO: 'Otro',
}

interface Props {
  tarea: TareaTablero
  onEliminar: (idTarea: string) => void
  onDragStart: (idTarea: string) => void
  onEditar?: () => void
}

export default function TarjetaTarea({ tarea, onEliminar, onDragStart, onEditar }: Props) {
  const [viendo, setViendo] = useState(false)

  return (
    <div
      draggable={!viendo}
      onDragStart={() => { if (!viendo) onDragStart(tarea.id_tarea) }}
      className="group cursor-grab rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing dark:border-gray-700 dark:bg-gray-800"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{tarea.titulo}</p>
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={(e) => { e.stopPropagation(); setViendo((v) => !v) }}
            aria-label={viendo ? 'Cerrar detalle' : 'Ver detalle'}
            className={`rounded p-0.5 transition-colors ${viendo ? 'text-indigo-500 dark:text-indigo-400' : 'text-gray-300 hover:text-indigo-500 dark:text-gray-600 dark:hover:text-indigo-400'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
              <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
              <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41ZM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" clipRule="evenodd" />
            </svg>
          </button>
          {onEditar && (
            <button
              onClick={(e) => { e.stopPropagation(); onEditar() }}
              aria-label="Editar tarea"
              className="rounded p-0.5 text-gray-300 hover:text-indigo-500 dark:text-gray-600 dark:hover:text-indigo-400"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
                <path d="M2.695 14.763l-1.262 3.154a.5.5 0 0 0 .65.65l3.155-1.262a4 4 0 0 0 1.343-.885L17.5 5.5a2.121 2.121 0 0 0-3-3L3.58 13.42a4 4 0 0 0-.885 1.343Z" />
              </svg>
            </button>
          )}
          <button
            onClick={() => onEliminar(tarea.id_tarea)}
            aria-label="Eliminar tarea"
            className="rounded p-0.5 text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
              <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {tarea.descripcion && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{tarea.descripcion}</p>
      )}

      <div className="mt-2">
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${COLORES_PRIORIDAD[tarea.prioridad]}`}>
          {LABELS_PRIORIDAD[tarea.prioridad]}
        </span>
      </div>

      {viendo && (
        <div className="mt-3 flex flex-col gap-1.5 border-t border-gray-100 pt-3 dark:border-gray-700">
          {tarea.materia ? (
            <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5 shrink-0 text-gray-400 dark:text-gray-500" aria-hidden>
                <path d="M7.702 1.368a.75.75 0 0 1 .597 0c2.098.91 4.105 1.99 6.004 3.223a.75.75 0 0 1-.194 1.348A34.27 34.27 0 0 0 8.341 8.25a.75.75 0 0 1-.682 0 34.27 34.27 0 0 0-5.768-2.311.75.75 0 0 1-.194-1.348 35.803 35.803 0 0 1 6.005-3.223ZM1 11.026a.75.75 0 0 1 .756-.744 35.48 35.48 0 0 1 4.376.575l.15.03a.75.75 0 0 1-.293 1.47l-.15-.03A34.003 34.003 0 0 0 1.75 11.77.75.75 0 0 1 1 11.026Zm13.5 0a.75.75 0 0 0-.756-.744 35.48 35.48 0 0 0-4.376.575l-.15.03a.75.75 0 0 0 .293 1.47l.15-.03A34.003 34.003 0 0 1 13.25 11.77a.75.75 0 0 0 .75-.744Z" />
              </svg>
              <span className="font-medium">Materia:</span>
              <span>{tarea.materia.nombre_materia}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5 shrink-0" aria-hidden>
                <path d="M7.702 1.368a.75.75 0 0 1 .597 0c2.098.91 4.105 1.99 6.004 3.223a.75.75 0 0 1-.194 1.348A34.27 34.27 0 0 0 8.341 8.25a.75.75 0 0 1-.682 0 34.27 34.27 0 0 0-5.768-2.311.75.75 0 0 1-.194-1.348 35.803 35.803 0 0 1 6.005-3.223ZM1 11.026a.75.75 0 0 1 .756-.744 35.48 35.48 0 0 1 4.376.575l.15.03a.75.75 0 0 1-.293 1.47l-.15-.03A34.003 34.003 0 0 0 1.75 11.77.75.75 0 0 1 1 11.026Zm13.5 0a.75.75 0 0 0-.756-.744 35.48 35.48 0 0 0-4.376.575l-.15.03a.75.75 0 0 0 .293 1.47l.15-.03A34.003 34.003 0 0 1 13.25 11.77a.75.75 0 0 0 .75-.744Z" />
              </svg>
              <span className="italic">Sin materia</span>
            </div>
          )}

          {tarea.evento ? (
            <div className="flex items-start gap-1.5 text-xs text-gray-600 dark:text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="mt-px h-3.5 w-3.5 shrink-0 text-gray-400 dark:text-gray-500" aria-hidden>
                <path fillRule="evenodd" d="M4 1.75a.75.75 0 0 1 1.5 0V3h5V1.75a.75.75 0 0 1 1.5 0V3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2V1.75ZM4.5 6a.5.5 0 0 0 0 1h7a.5.5 0 0 0 0-1h-7Zm0 2.5a.5.5 0 0 0 0 1h7a.5.5 0 0 0 0-1h-7Zm0 2.5a.5.5 0 0 0 0 1h4a.5.5 0 0 0 0-1h-4Z" clipRule="evenodd" />
              </svg>
              <div className="flex flex-col gap-0.5">
                <span><span className="font-medium">Evento:</span> {tarea.evento.titulo}</span>
                <span className="text-gray-400 dark:text-gray-500">
                  {LABELS_TIPO_EVENTO[tarea.evento.tipo_evento] ?? tarea.evento.tipo_evento}
                  {' · '}
                  {new Date(tarea.evento.fecha_inicio).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5 shrink-0" aria-hidden>
                <path fillRule="evenodd" d="M4 1.75a.75.75 0 0 1 1.5 0V3h5V1.75a.75.75 0 0 1 1.5 0V3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2V1.75ZM4.5 6a.5.5 0 0 0 0 1h7a.5.5 0 0 0 0-1h-7Zm0 2.5a.5.5 0 0 0 0 1h7a.5.5 0 0 0 0-1h-7Zm0 2.5a.5.5 0 0 0 0 1h4a.5.5 0 0 0 0-1h-4Z" clipRule="evenodd" />
              </svg>
              <span className="italic">Sin evento</span>
            </div>
          )}

          {tarea.estimacion_min != null && (
            <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5 shrink-0 text-gray-400 dark:text-gray-500" aria-hidden>
                <path fillRule="evenodd" d="M1 8a7 7 0 1 1 14 0A7 7 0 0 1 1 8Zm7.75-4.25a.75.75 0 0 0-1.5 0V8c0 .414.336.75.75.75h3.25a.75.75 0 0 0 0-1.5h-2.5v-3.5Z" clipRule="evenodd" />
              </svg>
              <span><span className="font-medium">Estimación:</span> {tarea.estimacion_min} min</span>
            </div>
          )}

          {tarea.fecha_vencimiento && (
            <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5 shrink-0 text-gray-400 dark:text-gray-500" aria-hidden>
                <path d="M5.75 7.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM5 10.25a.75.75 0 1 1 1.5 0 .75.75 0 0 1-1.5 0ZM10.25 7.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM9.5 10.25a.75.75 0 1 1 1.5 0 .75.75 0 0 1-1.5 0ZM8 7.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM7.25 10.25a.75.75 0 1 1 1.5 0 .75.75 0 0 1-1.5 0Z" />
                <path fillRule="evenodd" d="M4 1.75a.75.75 0 0 1 1.5 0V3h5V1.75a.75.75 0 0 1 1.5 0V3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2V1.75Zm-.5 5.5v4.25c0 .276.224.5.5.5h8a.5.5 0 0 0 .5-.5V7.25H3.5Z" clipRule="evenodd" />
              </svg>
              <span>
                <span className="font-medium">Vencimiento:</span>{' '}
                {new Date(tarea.fecha_vencimiento).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

'use client'

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

interface Props {
  tarea: TareaTablero
  onEliminar: (idTarea: string) => void
  onDragStart: (idTarea: string) => void
}

export default function TarjetaTarea({ tarea, onEliminar, onDragStart }: Props) {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(tarea.id_tarea)}
      className="group cursor-grab rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing dark:border-gray-700 dark:bg-gray-800"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{tarea.titulo}</p>
        <button
          onClick={() => onEliminar(tarea.id_tarea)}
          aria-label="Eliminar tarea"
          className="shrink-0 rounded p-0.5 text-gray-300 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100 dark:text-gray-600 dark:hover:text-red-400"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
            <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {tarea.descripcion && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{tarea.descripcion}</p>
      )}

      <div className="mt-2">
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${COLORES_PRIORIDAD[tarea.prioridad]}`}>
          {LABELS_PRIORIDAD[tarea.prioridad]}
        </span>
      </div>
    </div>
  )
}

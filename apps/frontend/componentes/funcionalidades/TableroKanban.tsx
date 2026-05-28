'use client'

import type { EstadoTarea } from '@/tipos'
import ColumnaTablero from '@/componentes/interfaz/ColumnaTablero'
import { useTareaTablero } from './useTareaTablero'

const ESTADOS: EstadoTarea[] = ['POR_HACER', 'EN_PROGRESO', 'COMPLETADO']

export default function TableroKanban() {
  const {
    tareas,
    cargando,
    columnaActiva,
    setTareaArrastrada,
    setColumnaActiva,
    eliminarTarea,
    agregarTarea,
    handleDrop,
  } = useTareaTablero()

  if (cargando) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {ESTADOS.map((estado) => (
          <div
            key={estado}
            className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
          >
            <div className="h-4 w-24 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
            {[1, 2].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-700" />
            ))}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {ESTADOS.map((estado) => (
        <ColumnaTablero
          key={estado}
          estado={estado}
          tareas={tareas.filter((t) => t.estado === estado)}
          sobreLaColumna={columnaActiva === estado}
          onDragOver={(e) => { e.preventDefault(); setColumnaActiva(estado) }}
          onDrop={() => handleDrop(estado)}
          onDragLeave={() => setColumnaActiva(null)}
          onDragStartTarea={setTareaArrastrada}
          onEliminarTarea={eliminarTarea}
          onAgregarTarea={agregarTarea}
        />
      ))}
    </div>
  )
}

'use client'

import { useState } from 'react'
import ColumnaTablero from '@/componentes/interfaz/ColumnaTablero'
import { useTareaTablero } from './useTareaTablero'

const SKELETON_COUNT = 3

export default function TableroKanban() {
  const {
    tareas,
    columnas,
    cargando,
    procesandoColumna,
    errorColumna,
    columnaActiva,
    materias,
    getEventos,
    setTareaArrastrada,
    setColumnaActiva,
    setErrorColumna,
    eliminarTarea,
    agregarTarea,
    agregarColumna,
    eliminarColumna,
    handleDrop,
  } = useTareaTablero()

  const [mostrarFormColumna, setMostrarFormColumna] = useState(false)
  const [nombreNuevaColumna, setNombreNuevaColumna] = useState('')

  async function confirmarNuevaColumna(e: React.FormEvent) {
    e.preventDefault()
    const nombre = nombreNuevaColumna.trim()
    if (!nombre) return
    const exito = await agregarColumna(nombre)
    if (exito) {
      setNombreNuevaColumna('')
      setMostrarFormColumna(false)
    }
  }

  function cancelarFormColumna() {
    setNombreNuevaColumna('')
    setMostrarFormColumna(false)
  }

  if (cargando) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
            <div className="h-4 w-24 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
            {[1, 2].map((j) => (
              <div key={j} className="h-20 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-700" />
            ))}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {errorColumna && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-400">
          <span>{errorColumna}</span>
          <button
            onClick={() => setErrorColumna('')}
            aria-label="Cerrar"
            className="ml-4 shrink-0 text-red-400 hover:text-red-600 dark:hover:text-red-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {columnas.map((columna) => (
          <ColumnaTablero
            key={columna.id_columna}
            columna={columna}
            tareas={tareas.filter((t) => t.estado === columna.identificador)}
            sobreLaColumna={columnaActiva === columna.identificador}
            materias={materias}
            getEventos={getEventos}
            onDragOver={(e) => { e.preventDefault(); setColumnaActiva(columna.identificador) }}
            onDrop={() => handleDrop(columna.identificador)}
            onDragLeave={() => setColumnaActiva(null)}
            onDragStartTarea={setTareaArrastrada}
            onEliminarTarea={eliminarTarea}
            onAgregarTarea={agregarTarea}
            onEliminarColumna={eliminarColumna}
          />
        ))}
      </div>

      <div className="mt-2">
        {mostrarFormColumna ? (
          <form
            onSubmit={confirmarNuevaColumna}
            className="flex max-w-xs items-center gap-2"
          >
            <input
              autoFocus
              value={nombreNuevaColumna}
              onChange={(e) => setNombreNuevaColumna(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Escape') cancelarFormColumna() }}
              maxLength={50}
              placeholder="Nombre de la columna"
              className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-500"
            />
            <button
              type="submit"
              disabled={!nombreNuevaColumna.trim() || procesandoColumna}
              className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {procesandoColumna ? 'Creando...' : 'Crear'}
            </button>
            <button
              type="button"
              onClick={cancelarFormColumna}
              className="rounded-lg px-3 py-2 text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Cancelar
            </button>
          </form>
        ) : (
          <button
            onClick={() => setMostrarFormColumna(true)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
              <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
            </svg>
            Nueva columna
          </button>
        )}
      </div>
    </div>
  )
}

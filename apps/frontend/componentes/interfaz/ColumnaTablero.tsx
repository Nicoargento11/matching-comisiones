'use client'

import { useState } from 'react'
import type { EstadoTarea, TareaTablero } from '@/tipos'
import TarjetaTarea from './TarjetaTarea'

const CONFIG: Record<EstadoTarea, { label: string; headerColor: string; dotColor: string }> = {
  POR_HACER: {
    label: 'Por hacer',
    headerColor: 'text-gray-700 dark:text-gray-300',
    dotColor: 'bg-gray-400',
  },
  EN_PROGRESO: {
    label: 'En progreso',
    headerColor: 'text-indigo-700 dark:text-indigo-300',
    dotColor: 'bg-indigo-500',
  },
  COMPLETADO: {
    label: 'Completado',
    headerColor: 'text-emerald-700 dark:text-emerald-300',
    dotColor: 'bg-emerald-500',
  },
}

interface Props {
  estado: EstadoTarea
  tareas: TareaTablero[]
  sobreLaColumna: boolean
  onDragOver: (e: React.DragEvent) => void
  onDrop: () => void
  onDragLeave: () => void
  onDragStartTarea: (idTarea: string) => void
  onEliminarTarea: (idTarea: string) => void
  onAgregarTarea: (estado: EstadoTarea, titulo: string) => void
}

export default function ColumnaTablero({
  estado,
  tareas,
  sobreLaColumna,
  onDragOver,
  onDrop,
  onDragLeave,
  onDragStartTarea,
  onEliminarTarea,
  onAgregarTarea,
}: Props) {
  const config = CONFIG[estado]
  const [inputVisible, setInputVisible] = useState(false)
  const [titulo, setTitulo] = useState('')

  function confirmar() {
    const t = titulo.trim()
    if (t) onAgregarTarea(estado, t)
    setTitulo('')
    setInputVisible(false)
  }

  return (
    <div
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragLeave={onDragLeave}
      className={`flex flex-col gap-3 rounded-2xl border p-4 transition-colors ${
        sobreLaColumna
          ? 'border-indigo-300 bg-indigo-50/60 dark:border-indigo-600 dark:bg-indigo-900/20'
          : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${config.dotColor}`} aria-hidden />
        <h2 className={`text-sm font-semibold ${config.headerColor}`}>{config.label}</h2>
        <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-400">
          {tareas.length}
        </span>
      </div>

      <div className="flex min-h-[4rem] flex-col gap-2">
        {tareas.map((tarea) => (
          <TarjetaTarea
            key={tarea.id_tarea}
            tarea={tarea}
            onEliminar={onEliminarTarea}
            onDragStart={onDragStartTarea}
          />
        ))}
      </div>

      {inputVisible ? (
        <div className="flex flex-col gap-2">
          <input
            autoFocus
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') confirmar()
              if (e.key === 'Escape') { setTitulo(''); setInputVisible(false) }
            }}
            placeholder="Nombre de la tarea..."
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-500"
          />
          <div className="flex gap-2">
            <button
              onClick={confirmar}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
            >
              Agregar
            </button>
            <button
              onClick={() => { setTitulo(''); setInputVisible(false) }}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setInputVisible(true)}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
            <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
          </svg>
          Agregar tarea
        </button>
      )}
    </div>
  )
}

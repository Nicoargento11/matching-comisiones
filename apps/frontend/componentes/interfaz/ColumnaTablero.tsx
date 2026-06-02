'use client'

import { useState } from 'react'
import type { ColumnaKanban, DatosTarea, PrioridadTarea, TareaTablero } from '@/tipos'
import type { EventoOpcion, MateriaOpcion } from '@/componentes/funcionalidades/useTareaTablero'
import TarjetaTarea from './TarjetaTarea'

const CONFIG_GLOBAL: Record<string, { headerColor: string; dotColor: string }> = {
  POR_HACER: {
    headerColor: 'text-gray-700 dark:text-gray-300',
    dotColor: 'bg-gray-400',
  },
  EN_PROGRESO: {
    headerColor: 'text-indigo-700 dark:text-indigo-300',
    dotColor: 'bg-indigo-500',
  },
  COMPLETADO: {
    headerColor: 'text-emerald-700 dark:text-emerald-300',
    dotColor: 'bg-emerald-500',
  },
}

const CONFIG_CUSTOM = {
  headerColor: 'text-violet-700 dark:text-violet-300',
  dotColor: 'bg-violet-400',
}

const INPUT_CLASS =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-500 disabled:cursor-not-allowed disabled:opacity-50'

interface Props {
  columna: ColumnaKanban
  tareas: TareaTablero[]
  sobreLaColumna: boolean
  materias: MateriaOpcion[]
  getEventos: (idMateria: number) => EventoOpcion[]
  onDragOver: (e: React.DragEvent) => void
  onDrop: () => void
  onDragLeave: () => void
  onDragStartTarea: (idTarea: string) => void
  onEliminarTarea: (idTarea: string) => void
  onAgregarTarea: (identificador: string, datos: DatosTarea) => void
  onEliminarColumna?: (idColumna: number) => void
}

const ESTADO_INICIAL: DatosTarea = {
  titulo: '',
  prioridad: 'MEDIA',
  descripcion: undefined,
  id_materia: undefined,
  id_evento: undefined,
  estimacion_min: undefined,
}

export default function ColumnaTablero({
  columna,
  tareas,
  sobreLaColumna,
  materias,
  getEventos,
  onDragOver,
  onDrop,
  onDragLeave,
  onDragStartTarea,
  onEliminarTarea,
  onAgregarTarea,
  onEliminarColumna,
}: Props) {
  const config = CONFIG_GLOBAL[columna.identificador] ?? CONFIG_CUSTOM
  const [formVisible, setFormVisible] = useState(false)
  const [datos, setDatos] = useState<DatosTarea>(ESTADO_INICIAL)
  const [confirmarEliminar, setConfirmarEliminar] = useState(false)

  const eventosDisponibles: EventoOpcion[] =
    datos.id_materia != null ? getEventos(datos.id_materia) : []

  function setField<K extends keyof DatosTarea>(key: K, value: DatosTarea[K]) {
    setDatos((prev) => ({ ...prev, [key]: value }))
  }

  function handleMateriaChange(idMateriaStr: string) {
    const idMateria = idMateriaStr ? Number(idMateriaStr) : undefined
    setDatos((prev) => ({ ...prev, id_materia: idMateria, id_evento: undefined }))
  }

  function confirmar() {
    const titulo = datos.titulo.trim()
    if (!titulo) return
    onAgregarTarea(columna.identificador, {
      titulo,
      prioridad: datos.prioridad,
      descripcion: datos.descripcion?.trim() || undefined,
      id_materia: datos.id_materia,
      id_evento: datos.id_evento,
      estimacion_min: datos.estimacion_min,
    })
    setDatos(ESTADO_INICIAL)
    setFormVisible(false)
  }

  function cancelar() {
    setDatos(ESTADO_INICIAL)
    setFormVisible(false)
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
        <span className={`h-2 w-2 shrink-0 rounded-full ${config.dotColor}`} aria-hidden />
        <h2 className={`text-sm font-semibold ${config.headerColor}`}>{columna.nombre}</h2>
        <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-400">
          {tareas.length}
        </span>

        {!columna.es_global && onEliminarColumna && (
          <div className="ml-auto flex items-center gap-1">
            {confirmarEliminar ? (
              <>
                <span className="text-xs text-red-500 dark:text-red-400">¿Eliminar?</span>
                <button
                  type="button"
                  onClick={() => onEliminarColumna(columna.id_columna)}
                  className="rounded px-1.5 py-0.5 text-xs font-medium text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30"
                >
                  Sí
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmarEliminar(false)}
                  className="rounded px-1.5 py-0.5 text-xs font-medium text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700"
                >
                  No
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmarEliminar(true)}
                aria-label="Eliminar columna"
                className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
                  <path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.711Z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        )}
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

      {formVisible ? (
        <div className="flex flex-col gap-2">
          <input
            autoFocus
            value={datos.titulo}
            onChange={(e) => setField('titulo', e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Escape') cancelar() }}
            placeholder="Título de la tarea *"
            className={INPUT_CLASS}
          />

          <textarea
            value={datos.descripcion ?? ''}
            onChange={(e) => setField('descripcion', e.target.value || undefined)}
            placeholder="Descripción (opcional)"
            rows={2}
            className={`${INPUT_CLASS} resize-none`}
          />

          {materias.length > 0 && (
            <>
              <select
                value={datos.id_materia ?? ''}
                onChange={(e) => handleMateriaChange(e.target.value)}
                className={INPUT_CLASS}
              >
                <option value="">— Materia (opcional) —</option>
                {materias.map((m) => (
                  <option key={m.id_materia} value={m.id_materia}>
                    {m.nombre_materia}
                  </option>
                ))}
              </select>

              <select
                value={datos.id_evento ?? ''}
                onChange={(e) => setField('id_evento', e.target.value ? Number(e.target.value) : undefined)}
                disabled={datos.id_materia == null || eventosDisponibles.length === 0}
                className={INPUT_CLASS}
              >
                <option value="">
                  {datos.id_materia == null
                    ? '— Seleccioná una materia primero —'
                    : eventosDisponibles.length === 0
                      ? '— Sin eventos disponibles —'
                      : '— Evento (opcional) —'}
                </option>
                {eventosDisponibles.map((ev) => (
                  <option key={ev.id_evento} value={ev.id_evento}>
                    {ev.titulo}
                  </option>
                ))}
              </select>
            </>
          )}

          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              value={datos.estimacion_min ?? ''}
              onChange={(e) => setField('estimacion_min', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="Estimación (min)"
              className={INPUT_CLASS}
            />
          </div>

          <div className="flex items-center gap-1">
            {(['BAJA', 'MEDIA', 'ALTA'] as PrioridadTarea[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setField('prioridad', p)}
                className={`flex-1 rounded-lg py-1 text-[10px] font-semibold transition-colors ${
                  datos.prioridad === p
                    ? p === 'ALTA'
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                      : p === 'MEDIA'
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400'
                        : 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300'
                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-700/50 dark:text-gray-500 dark:hover:bg-gray-700'
                }`}
              >
                {p === 'BAJA' ? 'Baja' : p === 'MEDIA' ? 'Media' : 'Alta'}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={confirmar}
              disabled={!datos.titulo.trim()}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Agregar
            </button>
            <button
              onClick={cancelar}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setFormVisible(true)}
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

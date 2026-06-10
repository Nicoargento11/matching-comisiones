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
  onEditarTarea?: (idTarea: string, datos: DatosTarea) => void
  onEditarColumna?: (idColumna: number, nombre: string) => void
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
  onEditarTarea,
  onEditarColumna,
}: Props) {
  const config = CONFIG_GLOBAL[columna.identificador] ?? CONFIG_CUSTOM

  const [formVisible, setFormVisible] = useState(false)
  const [datos, setDatos] = useState<DatosTarea>(ESTADO_INICIAL)
  const [confirmarEliminar, setConfirmarEliminar] = useState(false)

  const [tareaEditando, setTareaEditando] = useState<TareaTablero | null>(null)
  const [datosEdicion, setDatosEdicion] = useState<DatosTarea>(ESTADO_INICIAL)

  const [editandoNombre, setEditandoNombre] = useState(false)
  const [nombreEditado, setNombreEditado] = useState('')

  const eventosDisponibles: EventoOpcion[] = datos.id_materia != null ? getEventos(datos.id_materia) : []
  const eventosEdicion: EventoOpcion[] = datosEdicion.id_materia != null ? getEventos(datosEdicion.id_materia) : []

  function setField<K extends keyof DatosTarea>(key: K, value: DatosTarea[K]) {
    setDatos((prev) => ({ ...prev, [key]: value }))
  }

  function setEdField<K extends keyof DatosTarea>(key: K, value: DatosTarea[K]) {
    setDatosEdicion((prev) => ({ ...prev, [key]: value }))
  }

  function handleMateriaChange(idMateriaStr: string) {
    const idMateria = idMateriaStr ? Number(idMateriaStr) : undefined
    setDatos((prev) => ({ ...prev, id_materia: idMateria, id_evento: undefined }))
  }

  function handleMateriaEdicion(idMateriaStr: string) {
    const idMateria = idMateriaStr ? Number(idMateriaStr) : undefined
    setDatosEdicion((prev) => ({ ...prev, id_materia: idMateria, id_evento: undefined }))
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

  function iniciarEdicionTarea(tarea: TareaTablero) {
    setFormVisible(false)
    setTareaEditando(tarea)
    setDatosEdicion({
      titulo: tarea.titulo,
      prioridad: tarea.prioridad,
      descripcion: tarea.descripcion,
      id_materia: tarea.materia?.id_materia,
      id_evento: tarea.evento?.id_evento,
      estimacion_min: tarea.estimacion_min,
    })
  }

  function confirmarEdicion() {
    if (!tareaEditando) return
    const titulo = datosEdicion.titulo.trim()
    if (!titulo) return
    onEditarTarea?.(tareaEditando.id_tarea, {
      ...datosEdicion,
      titulo,
      descripcion: datosEdicion.descripcion?.trim() || undefined,
    })
    setTareaEditando(null)
    setDatosEdicion(ESTADO_INICIAL)
  }

  function cancelarEdicion() {
    setTareaEditando(null)
    setDatosEdicion(ESTADO_INICIAL)
  }

  function guardarNombreColumna() {
    const nombre = nombreEditado.trim()
    setEditandoNombre(false)
    if (!nombre || nombre === columna.nombre) return
    onEditarColumna?.(columna.id_columna, nombre)
  }

  function eventoPlaceholder(idMateria: number | undefined, eventos: EventoOpcion[]): string {
    if (idMateria == null) return 'Evento — Seleccioná una materia primero'
    if (eventos.length === 0) return '— Sin eventos disponibles —'
    return '— Evento (opcional) —'
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

        {editandoNombre ? (
          <>
            <input
              autoFocus
              value={nombreEditado}
              onChange={(e) => setNombreEditado(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') guardarNombreColumna()
                if (e.key === 'Escape') setEditandoNombre(false)
              }}
              maxLength={50}
              className="flex-1 rounded border border-indigo-300 bg-white px-2 py-0.5 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-400 dark:border-indigo-600 dark:bg-gray-700 dark:text-gray-200"
            />
            <button
              type="button"
              onClick={guardarNombreColumna}
              aria-label="Guardar nombre"
              className="rounded px-1.5 py-0.5 text-xs font-medium text-indigo-600 hover:bg-indigo-100 dark:text-indigo-400 dark:hover:bg-indigo-900/30"
            >
              ✓
            </button>
            <button
              type="button"
              onClick={() => setEditandoNombre(false)}
              aria-label="Cancelar edición"
              className="rounded px-1.5 py-0.5 text-xs font-medium text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              ✕
            </button>
          </>
        ) : (
          <>
            <h2 className={`text-sm font-semibold ${config.headerColor}`}>{columna.nombre}</h2>
            <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-400">
              {tareas.length}
            </span>
          </>
        )}

        {!columna.es_global && (onEliminarColumna || onEditarColumna) && !editandoNombre && (
          <div className="ml-auto flex items-center gap-1">
            {confirmarEliminar && onEliminarColumna ? (
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
              <>
                {onEditarColumna && (
                  <button
                    type="button"
                    onClick={() => { setEditandoNombre(true); setNombreEditado(columna.nombre) }}
                    aria-label="Editar nombre de columna"
                    className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
                      <path d="M2.695 14.763l-1.262 3.154a.5.5 0 0 0 .65.65l3.155-1.262a4 4 0 0 0 1.343-.885L17.5 5.5a2.121 2.121 0 0 0-3-3L3.58 13.42a4 4 0 0 0-.885 1.343Z" />
                    </svg>
                  </button>
                )}
                {onEliminarColumna && (
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
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex min-h-[4rem] flex-col gap-2">
        {tareas.map((tarea) =>
          tareaEditando?.id_tarea === tarea.id_tarea ? (
            <div key={tarea.id_tarea} className="flex flex-col gap-2 rounded-xl border border-indigo-200 bg-white p-3 shadow-sm dark:border-indigo-700/50 dark:bg-gray-800">
              <input
                autoFocus
                value={datosEdicion.titulo}
                onChange={(e) => setEdField('titulo', e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Escape') cancelarEdicion() }}
                placeholder="Título de la tarea *"
                className={INPUT_CLASS}
              />

              <textarea
                value={datosEdicion.descripcion ?? ''}
                onChange={(e) => setEdField('descripcion', e.target.value || undefined)}
                placeholder="Descripción (opcional)"
                rows={2}
                className={`${INPUT_CLASS} resize-none`}
              />

              {materias.length > 0 && (
                <>
                  <select
                    value={datosEdicion.id_materia ?? ''}
                    onChange={(e) => handleMateriaEdicion(e.target.value)}
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
                    value={datosEdicion.id_evento ?? ''}
                    onChange={(e) => setEdField('id_evento', e.target.value ? Number(e.target.value) : undefined)}
                    disabled={datosEdicion.id_materia == null || eventosEdicion.length === 0}
                    className={INPUT_CLASS}
                  >
                    <option value="">{eventoPlaceholder(datosEdicion.id_materia, eventosEdicion)}</option>
                    {eventosEdicion.map((ev) => (
                      <option key={ev.id_evento} value={ev.id_evento}>
                        {ev.titulo}
                      </option>
                    ))}
                  </select>
                </>
              )}

              <input
                type="number"
                min={1}
                value={datosEdicion.estimacion_min ?? ''}
                onChange={(e) => setEdField('estimacion_min', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Estimación (min)"
                className={INPUT_CLASS}
              />

              <div className="flex items-center gap-1">
                {(['BAJA', 'MEDIA', 'ALTA'] as PrioridadTarea[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setEdField('prioridad', p)}
                    className={`flex-1 rounded-lg py-1 text-[10px] font-semibold transition-colors ${
                      datosEdicion.prioridad === p
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
                  onClick={confirmarEdicion}
                  disabled={!datosEdicion.titulo.trim()}
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Guardar
                </button>
                <button
                  onClick={cancelarEdicion}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <TarjetaTarea
              key={tarea.id_tarea}
              tarea={tarea}
              onEliminar={onEliminarTarea}
              onDragStart={onDragStartTarea}
              onEditar={onEditarTarea ? () => iniciarEdicionTarea(tarea) : undefined}
            />
          )
        )}
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
                <option value="">{eventoPlaceholder(datos.id_materia, eventosDisponibles)}</option>
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
          onClick={() => { setTareaEditando(null); setFormVisible(true) }}
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

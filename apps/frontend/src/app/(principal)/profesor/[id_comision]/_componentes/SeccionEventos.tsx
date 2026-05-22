'use client'

import { useState } from 'react'
import { comisionServicio } from '@/servicios/comisionServicio'
import BannerExito from '@/componentes/interfaz/BannerExito'
import { TIPOS_EVENTO, colorEvento, etiquetaEvento } from '@/lib/constantes'
import { utcAFechaArg, utcAHoraArg } from '@/lib/fechas'
import type { Comision, Evento, TipoEvento } from '@/tipos'

type Props = {
  eventosIniciales: Evento[]
  eventosBajaIniciales: Evento[]
  comision: Comision
  token: string | null
  onEventosChange: (activos: Evento[], bajas: Evento[]) => void
}

export default function SeccionEventos({ eventosIniciales, eventosBajaIniciales, comision, token, onEventosChange }: Props) {
  const [eventos, setEventos] = useState<Evento[]>(eventosIniciales)
  const [eventosDadosDeBaja, setEventosDadosDeBaja] = useState<Evento[]>(eventosBajaIniciales)
  const [mensaje, setMensaje] = useState('')
  const [nuevoEvento, setNuevoEvento] = useState({
    titulo: '',
    tipo: 'PARCIAL' as TipoEvento,
    fecha: '',
    hora: '',
    horaFin: '',
  })
  const [errorEvento, setErrorEvento] = useState('')
  const [guardandoEvento, setGuardandoEvento] = useState(false)
  const [editandoEvento, setEditandoEvento] = useState<Evento | null>(null)
  const [confirmandoCambios, setConfirmandoCambios] = useState(false)
  const [eventoAConfirmarEliminar, setEventoAConfirmarEliminar] = useState<Evento | null>(null)
  const [procesando, setProcesando] = useState(false)

  function mostrarExito(msg: string) {
    setMensaje(msg)
    setTimeout(() => setMensaje(''), 4000)
  }

  function actualizarEventos(activos: Evento[], bajas: Evento[]) {
    setEventos(activos)
    setEventosDadosDeBaja(bajas)
    onEventosChange(activos, bajas)
  }

  function resetForm() {
    setNuevoEvento({ titulo: '', tipo: 'PARCIAL', fecha: '', hora: '', horaFin: '' })
    setErrorEvento('')
    setEditandoEvento(null)
    setConfirmandoCambios(false)
  }

  function iniciarEditar(ev: Evento) {
    setEditandoEvento(ev)
    setNuevoEvento({
      titulo: ev.titulo,
      tipo: ev.tipo_evento,
      fecha: utcAFechaArg(ev.fecha_inicio),
      hora: utcAHoraArg(ev.fecha_inicio),
      horaFin: utcAHoraArg(ev.fecha_fin),
    })
    setErrorEvento('')
    setConfirmandoCambios(false)
  }

  function manejarSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorEvento('')

    if (!nuevoEvento.titulo.trim() || !nuevoEvento.fecha || !nuevoEvento.hora) {
      setErrorEvento('Completa título, fecha y hora de inicio')
      return
    }
    if (!nuevoEvento.horaFin) {
      setErrorEvento('La hora de fin es obligatoria')
      return
    }
    if (nuevoEvento.horaFin <= nuevoEvento.hora) {
      setErrorEvento('La hora de fin debe ser mayor a la hora de inicio')
      return
    }

    if (editandoEvento) {
      const sinCambios =
        nuevoEvento.titulo.trim() === editandoEvento.titulo &&
        nuevoEvento.tipo === editandoEvento.tipo_evento &&
        nuevoEvento.fecha === utcAFechaArg(editandoEvento.fecha_inicio) &&
        nuevoEvento.hora === utcAHoraArg(editandoEvento.fecha_inicio) &&
        nuevoEvento.horaFin === utcAHoraArg(editandoEvento.fecha_fin)
      if (sinCambios) {
        setErrorEvento('No se realizaron cambios. Modificá al menos un campo para guardar.')
        return
      }
      setConfirmandoCambios(true)
      return
    }

    ejecutarGuardar()
  }

  async function ejecutarGuardar() {
    if (guardandoEvento) return
    setGuardandoEvento(true)
    setConfirmandoCambios(false)
    try {
      if (editandoEvento) {
        await comisionServicio.eliminarEvento(comision.id_comision, editandoEvento.id_evento, token ?? undefined)
      }

      const fecha_inicio = `${nuevoEvento.fecha}T${nuevoEvento.hora}:00`
      const fecha_fin = `${nuevoEvento.fecha}T${nuevoEvento.horaFin}:00`
      const guardado = await comisionServicio.agregarEvento(
        comision.id_comision,
        {
          titulo: nuevoEvento.titulo.trim(),
          tipo_evento: nuevoEvento.tipo,
          fecha_inicio,
          fecha_fin,
          origen: 'PROFESOR',
          id_usuario: comision.profesor.id_usuario,
          id_materia: comision.materia.id_materia,
        },
        token ?? undefined,
      )

      if (editandoEvento) {
        actualizarEventos(
          eventos.map((ev) => (ev.id_evento === editandoEvento.id_evento ? guardado : ev)),
          eventosDadosDeBaja,
        )
        mostrarExito('Evento actualizado correctamente')
      } else {
        actualizarEventos([...eventos, guardado], eventosDadosDeBaja)
        mostrarExito(`El evento "${guardado.titulo}" fue guardado correctamente`)
      }

      resetForm()
    } catch {
      setErrorEvento('No se pudo guardar el evento. Intentá de nuevo.')
    } finally {
      setGuardandoEvento(false)
    }
  }

  async function confirmarEliminar() {
    if (!eventoAConfirmarEliminar || procesando) return
    const ev = eventoAConfirmarEliminar
    setEventoAConfirmarEliminar(null)
    setProcesando(true)
    try {
      await comisionServicio.eliminarEvento(comision.id_comision, ev.id_evento, token ?? undefined)
      actualizarEventos(
        eventos.filter((x) => x.id_evento !== ev.id_evento),
        [...eventosDadosDeBaja, ev],
      )
      mostrarExito('Evento dado de baja')
    } catch {
      mostrarExito('Error al dar de baja el evento. Intentá de nuevo.')
    } finally {
      setProcesando(false)
    }
  }

  async function reincorporar(ev: Evento) {
    if (procesando) return
    setProcesando(true)
    try {
      const reactivado = await comisionServicio.reactivarEvento(comision.id_comision, ev.id_evento, token ?? undefined)
      actualizarEventos(
        [...eventos, reactivado],
        eventosDadosDeBaja.filter((x) => x.id_evento !== ev.id_evento),
      )
      mostrarExito('Evento reincorporado')
    } catch {
      mostrarExito('Error al reincorporar el evento. Intentá de nuevo.')
    } finally {
      setProcesando(false)
    }
  }

  return (
    <section className="space-y-4">
      {mensaje && <BannerExito mensaje={mensaje} />}
      <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200">Eventos y evaluaciones</h2>

      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-4 text-sm font-medium text-gray-600 dark:text-gray-400">
          {editandoEvento ? 'Modificar evento' : 'Agregar evento (parcial, entrega TP u otro)'}
        </h3>

        {confirmandoCambios && (
          <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-300">
            <span>¿Seguro que querés guardar los cambios de este evento?</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={ejecutarGuardar}
                disabled={guardandoEvento}
                className="rounded-md bg-amber-500 px-2.5 py-1 text-white hover:bg-amber-600 disabled:opacity-60"
              >
                Confirmar
              </button>
              <button
                type="button"
                onClick={() => setConfirmandoCambios(false)}
                className="rounded-md border border-amber-300 px-2.5 py-1 hover:bg-amber-100 dark:border-amber-700 dark:hover:bg-amber-900/40"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        <form onSubmit={manejarSubmit} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Titulo del evento</label>
              <input
                type="text"
                value={nuevoEvento.titulo}
                onChange={(e) => setNuevoEvento((p) => ({ ...p, titulo: e.target.value }))}
                placeholder="Ej: Parcial 1er Cuatrimestre"
                className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Tipo</label>
              <select
                value={nuevoEvento.tipo}
                onChange={(e) => setNuevoEvento((p) => ({ ...p, tipo: e.target.value as TipoEvento }))}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              >
                {TIPOS_EVENTO.map((t) => (
                  <option key={t} value={t}>{etiquetaEvento[t]}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Fecha</label>
              <input
                type="date"
                value={nuevoEvento.fecha}
                onChange={(e) => setNuevoEvento((p) => ({ ...p, fecha: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Hora inicio</label>
              <input
                type="time"
                value={nuevoEvento.hora}
                onChange={(e) => setNuevoEvento((p) => ({ ...p, hora: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Hora fin</label>
              <input
                type="time"
                value={nuevoEvento.horaFin}
                onChange={(e) => setNuevoEvento((p) => ({ ...p, horaFin: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
          </div>

          {errorEvento && <p className="text-xs text-red-500">{errorEvento}</p>}

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={guardandoEvento || confirmandoCambios}
              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
            >
              {guardandoEvento ? 'Guardando...' : editandoEvento ? 'Guardar cambios' : 'Guardar evento'}
            </button>
            {editandoEvento && (
              <button
                type="button"
                onClick={resetForm}
                disabled={guardandoEvento}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-60 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancelar edición
              </button>
            )}
          </div>
        </form>
      </div>

      {eventoAConfirmarEliminar && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-300">
          <p>
            ¿Seguro que querés dar de baja el evento{' '}
            <span className="font-semibold">{eventoAConfirmarEliminar.titulo}</span>?
          </p>
          <div className="flex gap-2">
            <button
              onClick={confirmarEliminar}
              disabled={procesando}
              className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-60"
            >
              Confirmar
            </button>
            <button
              onClick={() => setEventoAConfirmarEliminar(null)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {eventos.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {eventos.map((ev) => {
              const fechaStr = utcAFechaArg(ev.fecha_inicio)
              const horaStr = utcAHoraArg(ev.fecha_inicio)
              const horaFinStr = ev.fecha_fin !== ev.fecha_inicio ? utcAHoraArg(ev.fecha_fin) : null
              return (
                <div key={ev.id_evento} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <div className="flex items-center gap-4">
                    <div className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: comision.materia.color }} />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{ev.titulo}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {fechaStr} · {horaStr}{horaFinStr ? ` – ${horaFinStr}` : ''}
                      </p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colorEvento[ev.tipo_evento]}`}>
                      {etiquetaEvento[ev.tipo_evento]}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => iniciarEditar(ev)}
                      className="text-xs text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                      Modificar
                    </button>
                    <button
                      onClick={() => setEventoAConfirmarEliminar(ev)}
                      className="text-xs text-red-400 hover:text-red-600 dark:hover:text-red-400"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {eventosDadosDeBaja.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Eventos dados de baja</p>
          <div className="divide-y divide-gray-100 rounded-lg border border-gray-100 dark:divide-gray-700 dark:border-gray-700">
            {eventosDadosDeBaja.map((ev) => (
              <div key={ev.id_evento} className="flex items-center justify-between px-4 py-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {ev.titulo} · {utcAFechaArg(ev.fecha_inicio)} {utcAHoraArg(ev.fecha_inicio)}
                </p>
                <button
                  onClick={() => reincorporar(ev)}
                  disabled={procesando}
                  className="rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 disabled:opacity-60 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-900/20"
                >
                  Reincorporar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

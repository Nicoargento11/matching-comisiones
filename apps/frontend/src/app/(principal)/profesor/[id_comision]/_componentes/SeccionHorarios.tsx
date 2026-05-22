'use client'

import { useState } from 'react'
import { comisionServicio } from '@/servicios/comisionServicio'
import BannerExito from '@/componentes/interfaz/BannerExito'
import InsigniaHorario from '@/componentes/interfaz/InsigniaHorario'
import InsigniaModalidad from '@/componentes/interfaz/InsigniaModalidad'
import { DIAS_SEMANA, FORMATOS_CLASE, HORA_MAXIMA_HORARIO, HORA_MINIMA_HORARIO, MODALIDADES, etiquetaFormato } from '@/lib/constantes'
import type { Comision, FormatoClase, Horario } from '@/tipos'

type Props = {
  horariosIniciales: Horario[]
  horariosBajaIniciales: Horario[]
  comision: Comision
  token: string | null
  onHorariosChange: (activos: Horario[], bajas: Horario[]) => void
}

function seSuperponeHorario(a: { hora_inicio: string; hora_fin: string }, b: { hora_inicio: string; hora_fin: string }) {
  return a.hora_inicio < b.hora_fin && a.hora_fin > b.hora_inicio
}

export default function SeccionHorarios({ horariosIniciales, horariosBajaIniciales, comision, token, onHorariosChange }: Props) {
  const [horarios, setHorarios] = useState<Horario[]>(horariosIniciales)
  const [horariosDadosDeBaja, setHorariosDadosDeBaja] = useState<Horario[]>(horariosBajaIniciales)
  const [mensaje, setMensaje] = useState('')
  const [nuevoHorario, setNuevoHorario] = useState({
    diaNombre: 'Lunes',
    hora_inicio: '',
    hora_fin: '',
    aula: '',
    formato: 'TEORICO' as FormatoClase,
    modalidad: 'presencial',
  })
  const [errorHorario, setErrorHorario] = useState('')
  const [guardandoHorario, setGuardandoHorario] = useState(false)
  const [editandoHorario, setEditandoHorario] = useState<Horario | null>(null)
  const [confirmandoCambios, setConfirmandoCambios] = useState(false)
  const [horarioAConfirmarEliminar, setHorarioAConfirmarEliminar] = useState<Horario | null>(null)
  const [procesando, setProcesando] = useState(false)

  function mostrarExito(msg: string) {
    setMensaje(msg)
    setTimeout(() => setMensaje(''), 4000)
  }

  function actualizarHorarios(activos: Horario[], bajas: Horario[]) {
    setHorarios(activos)
    setHorariosDadosDeBaja(bajas)
    onHorariosChange(activos, bajas)
  }

  function resetForm() {
    setNuevoHorario({ diaNombre: 'Lunes', hora_inicio: '', hora_fin: '', aula: '', formato: 'TEORICO', modalidad: 'presencial' })
    setErrorHorario('')
    setEditandoHorario(null)
    setConfirmandoCambios(false)
  }

  function iniciarEditar(h: Horario) {
    setEditandoHorario(h)
    setNuevoHorario({
      diaNombre: h.dia.nombre_dia,
      hora_inicio: h.hora_inicio,
      hora_fin: h.hora_fin,
      aula: h.aula?.nombre ?? '',
      formato: h.formato,
      modalidad: h.modalidad.nombre_modalidad.toLowerCase(),
    })
    setErrorHorario('')
    setConfirmandoCambios(false)
  }

  function validarSolape() {
    const otros = horarios.filter((h) => !editandoHorario || h.id_horario_comision !== editandoHorario.id_horario_comision)
    const mismosDia = otros.filter((h) => h.dia.nombre_dia.toLowerCase() === nuevoHorario.diaNombre.toLowerCase())
    if (mismosDia.some((h) => seSuperponeHorario(nuevoHorario, h))) {
      setErrorHorario('El horario se superpone con otro horario existente del mismo día')
      return false
    }
    return true
  }

  function manejarSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorHorario('')

    if (!nuevoHorario.hora_inicio || !nuevoHorario.hora_fin) {
      setErrorHorario('Completa los campos de hora de inicio y fin')
      return
    }
    if (nuevoHorario.hora_inicio >= nuevoHorario.hora_fin) {
      setErrorHorario('La hora de fin debe ser mayor a la hora de inicio')
      return
    }
    if (nuevoHorario.hora_inicio < HORA_MINIMA_HORARIO) {
      setErrorHorario(`El horario no puede empezar antes de las ${HORA_MINIMA_HORARIO}`)
      return
    }
    if (nuevoHorario.hora_fin > HORA_MAXIMA_HORARIO) {
      setErrorHorario(`El horario no puede terminar después de las ${HORA_MAXIMA_HORARIO}`)
      return
    }
    if (!validarSolape()) return

    if (editandoHorario) {
      const sinCambios =
        nuevoHorario.diaNombre === editandoHorario.dia.nombre_dia &&
        nuevoHorario.hora_inicio === editandoHorario.hora_inicio &&
        nuevoHorario.hora_fin === editandoHorario.hora_fin &&
        nuevoHorario.formato === editandoHorario.formato &&
        nuevoHorario.modalidad === editandoHorario.modalidad.nombre_modalidad.toLowerCase() &&
        nuevoHorario.aula === (editandoHorario.aula?.nombre ?? '')
      if (sinCambios) {
        setErrorHorario('No se realizaron cambios. Modificá al menos un campo para guardar.')
        return
      }
      setConfirmandoCambios(true)
      return
    }

    ejecutarGuardar()
  }

  async function ejecutarGuardar() {
    if (guardandoHorario) return
    setGuardandoHorario(true)
    setConfirmandoCambios(false)
    try {
      if (editandoHorario) {
        await comisionServicio.eliminarHorario(comision.id_comision, editandoHorario.id_horario_comision, token ?? undefined)
      }

      const payload = {
        hora_inicio: nuevoHorario.hora_inicio,
        hora_fin: nuevoHorario.hora_fin,
        nombre_dia: nuevoHorario.diaNombre,
        nombre_modalidad: nuevoHorario.modalidad,
        formato: nuevoHorario.formato,
        ...(nuevoHorario.aula.trim() && { nombre_aula: nuevoHorario.aula.trim() }),
      }

      const guardado = await comisionServicio.agregarHorario(comision.id_comision, payload, token ?? undefined)

      if (editandoHorario) {
        actualizarHorarios(
          horarios.map((h) => (h.id_horario_comision === editandoHorario.id_horario_comision ? guardado : h)),
          horariosDadosDeBaja,
        )
        mostrarExito('Horario actualizado correctamente')
      } else {
        actualizarHorarios([...horarios, guardado], horariosDadosDeBaja)
        mostrarExito(`Horario del ${guardado.dia.nombre_dia} de ${guardado.hora_inicio} a ${guardado.hora_fin} guardado correctamente`)
      }

      resetForm()
    } catch {
      setErrorHorario('No se pudo guardar el horario. Verificá que el día y la modalidad existan en el sistema.')
    } finally {
      setGuardandoHorario(false)
    }
  }

  async function confirmarEliminar() {
    if (!horarioAConfirmarEliminar || procesando) return
    const h = horarioAConfirmarEliminar
    setHorarioAConfirmarEliminar(null)
    setProcesando(true)
    try {
      await comisionServicio.eliminarHorario(comision.id_comision, h.id_horario_comision, token ?? undefined)
      actualizarHorarios(
        horarios.filter((x) => x.id_horario_comision !== h.id_horario_comision),
        [...horariosDadosDeBaja, h],
      )
      mostrarExito('Horario dado de baja')
    } catch {
      mostrarExito('Error al dar de baja el horario. Intentá de nuevo.')
    } finally {
      setProcesando(false)
    }
  }

  async function reincorporar(h: Horario) {
    if (procesando) return
    const mismosDia = horarios.filter((x) => x.dia.nombre_dia.toLowerCase() === h.dia.nombre_dia.toLowerCase())
    if (mismosDia.some((x) => seSuperponeHorario(h, x))) {
      mostrarExito('No se puede reincorporar: se superpone con otro horario activo del mismo día')
      return
    }
    setProcesando(true)
    try {
      const reactivado = await comisionServicio.reactivarHorario(comision.id_comision, h.id_horario_comision, token ?? undefined)
      actualizarHorarios(
        [...horarios, reactivado],
        horariosDadosDeBaja.filter((x) => x.id_horario_comision !== h.id_horario_comision),
      )
      mostrarExito('Horario reincorporado')
    } catch {
      mostrarExito('Error al reincorporar el horario. Intentá de nuevo.')
    } finally {
      setProcesando(false)
    }
  }

  return (
    <section className="space-y-4">
      {mensaje && <BannerExito mensaje={mensaje} />}
      <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200">Horarios semanales</h2>

      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-4 text-sm font-medium text-gray-600 dark:text-gray-400">
          {editandoHorario ? 'Modificar horario recurrente' : 'Agregar horario recurrente'}
        </h3>

        {confirmandoCambios && (
          <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-300">
            <span>¿Seguro que querés guardar los cambios de este horario?</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={ejecutarGuardar}
                disabled={guardandoHorario}
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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Dia</label>
              <select
                value={nuevoHorario.diaNombre}
                onChange={(e) => setNuevoHorario((p) => ({ ...p, diaNombre: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              >
                {DIAS_SEMANA.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Inicio</label>
              <input
                type="time"
                value={nuevoHorario.hora_inicio}
                onChange={(e) => setNuevoHorario((p) => ({ ...p, hora_inicio: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Fin</label>
              <input
                type="time"
                value={nuevoHorario.hora_fin}
                onChange={(e) => setNuevoHorario((p) => ({ ...p, hora_fin: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Formato</label>
              <select
                value={nuevoHorario.formato}
                onChange={(e) => setNuevoHorario((p) => ({ ...p, formato: e.target.value as FormatoClase }))}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              >
                {FORMATOS_CLASE.map((f) => (
                  <option key={f} value={f}>{etiquetaFormato[f]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Modalidad</label>
              <select
                value={nuevoHorario.modalidad}
                onChange={(e) => setNuevoHorario((p) => ({ ...p, modalidad: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              >
                {MODALIDADES.map((m) => (
                  <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Aula (opcional)</label>
            <input
              type="text"
              value={nuevoHorario.aula}
              onChange={(e) => setNuevoHorario((p) => ({ ...p, aula: e.target.value }))}
              placeholder="Ej: Aula 101 - Edificio Central"
              className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
            />
          </div>

          {errorHorario && <p className="text-xs text-red-500">{errorHorario}</p>}

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={guardandoHorario || confirmandoCambios}
              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
            >
              {guardandoHorario ? 'Guardando...' : editandoHorario ? 'Guardar cambios' : 'Guardar horario'}
            </button>
            {editandoHorario && (
              <button
                type="button"
                onClick={resetForm}
                disabled={guardandoHorario}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-60 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancelar edición
              </button>
            )}
          </div>
        </form>
      </div>

      {horarioAConfirmarEliminar && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-300">
          <p>
            ¿Seguro que querés dar de baja el horario del{' '}
            <span className="font-semibold">{horarioAConfirmarEliminar.dia.nombre_dia}</span> de{' '}
            {horarioAConfirmarEliminar.hora_inicio} a {horarioAConfirmarEliminar.hora_fin}?
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
              onClick={() => setHorarioAConfirmarEliminar(null)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {horarios.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {horarios.map((h) => (
              <div key={h.id_horario_comision} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="w-20 text-sm font-medium text-gray-700 dark:text-gray-300">{h.dia.nombre_dia}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{h.hora_inicio} – {h.hora_fin}</span>
                  {h.aula && <span className="text-xs text-gray-400 dark:text-gray-500">{h.aula.nombre}</span>}
                  <InsigniaHorario formato={h.formato} />
                  <InsigniaModalidad modalidad={h.modalidad.nombre_modalidad} />
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => iniciarEditar(h)}
                    className="text-xs text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                  >
                    Modificar
                  </button>
                  <button
                    onClick={() => setHorarioAConfirmarEliminar(h)}
                    className="text-xs text-red-400 hover:text-red-600 dark:hover:text-red-400"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {horariosDadosDeBaja.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Horarios dados de baja</p>
          <div className="divide-y divide-gray-100 rounded-lg border border-gray-100 dark:divide-gray-700 dark:border-gray-700">
            {horariosDadosDeBaja.map((h) => (
              <div key={h.id_horario_comision} className="flex items-center justify-between px-4 py-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {h.dia.nombre_dia} · {h.hora_inicio} – {h.hora_fin}
                </p>
                <button
                  onClick={() => reincorporar(h)}
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

'use client'

import { useState } from 'react'
import InsigniaHorario from '@/componentes/interfaz/InsigniaHorario'
import InsigniaModalidad from '@/componentes/interfaz/InsigniaModalidad'
import { Evento, Horario, TipoEvento } from '@/tipos'

type Filtro = 'ambos' | 'horarios' | 'eventos'

const etiquetaEvento: Record<TipoEvento, string> = {
  CLASE: 'Clase',
  PARCIAL: 'Parcial',
  ENTREGA_TP: 'Entrega TP',
  OTRO: 'Otro',
}

const colorEvento: Record<TipoEvento, string> = {
  CLASE: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  PARCIAL: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  ENTREGA_TP: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  OTRO: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400',
}

function utcAFechaArg(isoStr: string): string {
  const d = new Date(isoStr)
  const local = new Date(d.getTime() - 3 * 60 * 60 * 1000)
  return local.toISOString().slice(0, 10)
}

function utcAHoraArg(isoStr: string): string {
  const d = new Date(isoStr)
  const local = new Date(d.getTime() - 3 * 60 * 60 * 1000)
  return `${String(local.getUTCHours()).padStart(2, '0')}:${String(local.getUTCMinutes()).padStart(2, '0')}`
}

interface Props {
  horarios: Horario[]
  eventos: Evento[]
}

export default function SeccionHorariosEventos({ horarios, eventos }: Props) {
  const [filtro, setFiltro] = useState<Filtro>('ambos')

  const mostrarHorarios = filtro === 'ambos' || filtro === 'horarios'
  const mostrarEventos = filtro === 'ambos' || filtro === 'eventos'
  const eventosOrdenados = [...eventos].sort((a, b) => a.fecha_inicio.localeCompare(b.fecha_inicio))

  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
        {(['ambos', 'horarios', 'eventos'] as Filtro[]).map((f) => {
          const count = f === 'ambos' ? horarios.length + eventos.length : f === 'horarios' ? horarios.length : eventos.length
          const label = f === 'ambos' ? 'Ambos' : f === 'horarios' ? 'Horarios' : 'Eventos'
          return (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                filtro === f
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              {label}
              <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {mostrarHorarios && (
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-700">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13a.75.75 0 0 0-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 0 0 0-1.5h-3.25V5Z" clipRule="evenodd" />
              </svg>
              Horarios semanales
            </h2>
          </div>
          {horarios.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-gray-400 dark:text-gray-500">Sin horarios registrados</p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {horarios.map((h) => (
                <div key={h.id_horario_comision} className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="w-20 text-sm font-medium text-gray-700 dark:text-gray-300">
                      {h.dia.nombre_dia}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {h.hora_inicio} – {h.hora_fin}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {h.aula && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">{h.aula.nombre}</span>
                    )}
                    <InsigniaHorario formato={h.formato} />
                    <InsigniaModalidad modalidad={h.modalidad.nombre_modalidad} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {mostrarEventos && (
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-700">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M5.75 2a.75.75 0 0 1 .75.75V4h7V2.75a.75.75 0 0 1 1.5 0V4h.25A2.75 2.75 0 0 1 18 6.75v8.5A2.75 2.75 0 0 1 15.25 18H4.75A2.75 2.75 0 0 1 2 15.25v-8.5A2.75 2.75 0 0 1 4.75 4H5V2.75A.75.75 0 0 1 5.75 2Zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75Z" clipRule="evenodd" />
              </svg>
              Eventos y evaluaciones
            </h2>
          </div>
          {eventosOrdenados.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-gray-400 dark:text-gray-500">Sin eventos registrados</p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {eventosOrdenados.map((ev) => {
                const fecha = utcAFechaArg(ev.fecha_inicio)
                const horaInicio = utcAHoraArg(ev.fecha_inicio)
                const horaFin = utcAHoraArg(ev.fecha_fin)
                return (
                  <div key={ev.id_evento} className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="text-sm">
                        <p className="font-medium text-gray-900 dark:text-gray-100">{ev.titulo}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {fecha} · {horaInicio} – {horaFin}
                        </p>
                      </div>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${colorEvento[ev.tipo_evento]}`}>
                      {etiquetaEvento[ev.tipo_evento]}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

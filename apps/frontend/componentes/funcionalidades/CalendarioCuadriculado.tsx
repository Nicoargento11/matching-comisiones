'use client'

// calendario tipo google calendar con vistas mes semana y dia
// soporta horarios recurrentes y eventos de fecha especifica
import { useState } from 'react'
import { Comision } from '@/tipos'

// ─────────────────────────────────────────────
//  TIPOS INTERNOS
// ─────────────────────────────────────────────

interface EventoInterno {
  id: string
  titulo: string
  subtitulo: string
  fecha: Date
  // minutos desde medianoche (ej 8*60=480)
  horaInicio: number
  horaFin: number
  color: string
  materiaId: number
  tipo: string
  esHorario: boolean
}

const COLORES_TIPO: Record<string, string> = {
  PARCIAL:    '#ef4444',
  ENTREGA_TP: '#f59e0b',
  OTRO:       '#6b7280',
  CLASE:      '#6366f1',
}

type Vista = 'mes' | 'semana' | 'dia'

// ─────────────────────────────────────────────
//  CONSTANTES
// ─────────────────────────────────────────────

// rango de horas visibles en la grilla
const HORA_INICIO_GRILLA = 7
const HORA_FIN_GRILLA = 22
const TOTAL_HORAS = HORA_FIN_GRILLA - HORA_INICIO_GRILLA // 15
// pixeles por hora en la grilla de tiempo
const PX_POR_HORA = 64

const DIAS_SEMANA_LABELS = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom']
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

// mapeo de nombre de dia a numero javascript (0=dom 1=lun ...)
const DIA_A_JS: Record<string, number> = {
  domingo:   0,
  lunes:     1,
  martes:    2,
  miercoles: 3,
  jueves:    4,
  viernes:   5,
  sabado:    6,
}

// ─────────────────────────────────────────────
//  UTILIDADES DE FECHA
// ─────────────────────────────────────────────

function mismaFecha(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

// obtiene el lunes de la semana que contiene la fecha
function obtenerLunesDeSemana(fecha: Date): Date {
  const d = new Date(fecha)
  d.setHours(0, 0, 0, 0)
  const dia = d.getDay() // 0=dom
  const diff = dia === 0 ? -6 : 1 - dia
  d.setDate(d.getDate() + diff)
  return d
}

// convierte string HH:mm a minutos desde medianoche
function horaAMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number)
  return h * 60 + m
}

// Argentina es UTC-3 sin horario de verano (desde 1999)
// Extrae la hora local Argentina de un ISO datetime del backend
function utcAHoraArgentina(isoStr: string): string {
  const d = new Date(isoStr)
  // restamos 3hs al UTC para obtener hora Argentina
  const local = new Date(d.getTime() - 3 * 60 * 60 * 1000)
  const h = String(local.getUTCHours()).padStart(2, '0')
  const m = String(local.getUTCMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

// Extrae la fecha local Argentina (sin distorsion de timezone del browser)
function utcAFechaArgentina(isoStr: string): Date {
  const d = new Date(isoStr)
  const local = new Date(d.getTime() - 3 * 60 * 60 * 1000)
  // construimos la fecha usando los componentes UTC del datetime ajustado
  return new Date(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate())
}

// ─────────────────────────────────────────────
//  GENERADOR DE EVENTOS
// ─────────────────────────────────────────────

// genera todos los eventos del calendario a partir de las comisiones
// incluye horarios recurrentes y eventos de fecha especifica
function generarEventos(comisiones: Comision[], inicio: Date, fin: Date): EventoInterno[] {
  const eventos: EventoInterno[] = []

  for (const comision of comisiones) {
    // horarios recurrentes: se repiten cada semana (solo activos)
    const cursor = new Date(inicio)
    cursor.setHours(0, 0, 0, 0)
    const finCopia = new Date(fin)
    finCopia.setHours(23, 59, 59, 999)

    while (cursor <= finCopia) {
      const diaJS = cursor.getDay()
      const diaNombre = Object.entries(DIA_A_JS).find(([, n]) => n === diaJS)?.[0]
      if (diaNombre && diaNombre !== 'domingo') {
        for (const horario of comision.horarios) {
          // solo mostrar horarios activos (soft delete)
          if (horario.activo === false) continue
          if (horario.dia.nombre_dia.toLowerCase() !== diaNombre) continue

          const etiquetaFormato =
            horario.formato === 'TEORICO' ? 'Teorico'
            : horario.formato === 'PRACTICO' ? 'Practico'
            : 'Teo/Prac'
          const subtitulo = horario.aula
            ? `${etiquetaFormato} · ${horario.aula.nombre}`
            : etiquetaFormato

          eventos.push({
            id: `${horario.id_horario_comision}-${cursor.toISOString().split('T')[0]}`,
            titulo: comision.materia.nombre_materia,
            subtitulo,
            fecha: new Date(cursor),
            horaInicio: horaAMinutos(horario.hora_inicio),
            horaFin: horaAMinutos(horario.hora_fin),
            color: comision.materia.color,
            materiaId: comision.materia.id_materia,
            tipo: horario.formato,
            esHorario: true,
          })
        }
      }
      cursor.setDate(cursor.getDate() + 1)
    }

    // eventos de fecha especifica (parciales entregas etc)
    for (const evento of comision.eventos ?? []) {
      const fechaInicio = utcAFechaArgentina(evento.fecha_inicio)
      if (fechaInicio >= inicio && fechaInicio <= fin) {
        // extraemos la hora en timezone Argentina (UTC-3, sin DST)
        const hiStr = utcAHoraArgentina(evento.fecha_inicio)
        const hfStr = evento.fecha_fin ? utcAHoraArgentina(evento.fecha_fin) : null
        const horaInicioMin = horaAMinutos(hiStr)
        const horaFinMin = hfStr && hfStr !== '00:00' ? horaAMinutos(hfStr) : horaInicioMin + 60
        eventos.push({
          id: String(evento.id_evento),
          titulo: evento.titulo,
          subtitulo: comision.materia.nombre_materia,
          fecha: fechaInicio,
          horaInicio: horaInicioMin,
          horaFin: horaFinMin,
          color: COLORES_TIPO[evento.tipo_evento] ?? comision.materia.color,
          materiaId: evento.id_materia,
          tipo: evento.tipo_evento,
          esHorario: false,
        })
      }
    }
  }

  return eventos
}

// ─────────────────────────────────────────────
//  LAYOUT DE COLUMNAS PARA SOLAPAMIENTO
// ─────────────────────────────────────────────

interface EventoConLayout extends EventoInterno {
  columna: number
  totalColumnas: number
}

function calcularLayoutColumnas(eventos: EventoInterno[]): EventoConLayout[] {
  if (eventos.length === 0) return []

  // ordenamos por hora de inicio
  const ordenados = [...eventos].sort((a, b) => a.horaInicio - b.horaInicio)
  const resultado: EventoConLayout[] = []

  // grupos de eventos que se solapan entre sí
  const grupos: EventoInterno[][] = []
  let grupoActual: EventoInterno[] = []
  let maxFinGrupo = -1

  for (const ev of ordenados) {
    if (ev.horaInicio >= maxFinGrupo) {
      if (grupoActual.length > 0) grupos.push(grupoActual)
      grupoActual = [ev]
      maxFinGrupo = ev.horaFin
    } else {
      grupoActual.push(ev)
      maxFinGrupo = Math.max(maxFinGrupo, ev.horaFin)
    }
  }
  if (grupoActual.length > 0) grupos.push(grupoActual)

  for (const grupo of grupos) {
    // asignamos columnas dentro del grupo
    const columnas: number[] = []
    const finPorColumna: number[] = []
    for (const ev of grupo) {
      let col = finPorColumna.findIndex((fin) => ev.horaInicio >= fin)
      if (col === -1) {
        col = finPorColumna.length
        finPorColumna.push(ev.horaFin)
      } else {
        finPorColumna[col] = ev.horaFin
      }
      columnas.push(col)
    }
    const totalColumnas = finPorColumna.length
    grupo.forEach((ev, idx) => {
      resultado.push({ ...ev, columna: columnas[idx], totalColumnas })
    })
  }

  return resultado
}

function minutosAHora(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

// ─────────────────────────────────────────────
//  SUB-COMPONENTE: EVENTO EN GRILLA
// ─────────────────────────────────────────────

function BloqueEvento({ evento }: { evento: EventoConLayout }) {
  const top = (evento.horaInicio - HORA_INICIO_GRILLA * 60) * (PX_POR_HORA / 60)
  const height = Math.max((evento.horaFin - evento.horaInicio) * (PX_POR_HORA / 60), 24)
  const corto = height < 38

  const ancho = `calc((100% - 2px) / ${evento.totalColumnas})`
  const left = `calc((100% - 2px) / ${evento.totalColumnas} * ${evento.columna} + 1px)`

  return (
    <div
      className={`absolute overflow-hidden rounded shadow-sm transition-opacity hover:opacity-100 ${
        evento.esHorario
          ? 'opacity-75 border-l-2 z-10'
          : 'opacity-90 border border-white/30 z-20'
      }`}
      style={{
        top,
        height,
        width: ancho,
        left,
        backgroundColor: evento.color,
        borderLeftColor: evento.esHorario ? 'rgba(255,255,255,0.6)' : undefined,
      }}
      title={`${evento.titulo} · ${evento.subtitulo}\n${minutosAHora(evento.horaInicio)} – ${minutosAHora(evento.horaFin)}`}
    >
      <div className="px-1.5 py-0.5 text-white">
        <p className="truncate text-[10px] font-medium opacity-80 leading-tight">
          {minutosAHora(evento.horaInicio)} – {minutosAHora(evento.horaFin)}
        </p>
        <p className="truncate text-xs font-semibold leading-tight">{evento.titulo}</p>
        {!corto && (
          <p className="truncate text-[10px] opacity-80">{evento.subtitulo}</p>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
//  SUB-COMPONENTE: VISTA SEMANA
// ─────────────────────────────────────────────

function VistaSemana({ fechaNav, eventos, hoy }: {
  fechaNav: Date
  eventos: EventoInterno[]
  hoy: Date
}) {
  const lunes = obtenerLunesDeSemana(fechaNav)
  const dias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(lunes)
    d.setDate(lunes.getDate() + i)
    return d
  })
  const horas = Array.from({ length: TOTAL_HORAS }, (_, i) => HORA_INICIO_GRILLA + i)

  function eventosDelDia(dia: Date) {
    return eventos.filter((e) => mismaFecha(e.fecha, dia))
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      {/* cabecera con nombres de dias */}
      <div className="grid border-b border-gray-200 dark:border-gray-700" style={{ gridTemplateColumns: '4rem repeat(7, 1fr)' }}>
        <div className="border-r border-gray-100 dark:border-gray-700" />
        {dias.map((dia, i) => {
          const esHoy = mismaFecha(dia, hoy)
          return (
            <div
              key={i}
              className={`py-2 text-center ${i < 6 ? 'border-r border-gray-100 dark:border-gray-700' : ''}`}
            >
              <p className="text-xs text-gray-400 dark:text-gray-500">{DIAS_SEMANA_LABELS[i]}</p>
              <span
                className={`mx-auto mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                  esHoy
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {dia.getDate()}
              </span>
            </div>
          )
        })}
      </div>

      {/* grilla de tiempo */}
      <div className="overflow-y-auto" style={{ maxHeight: `${TOTAL_HORAS * PX_POR_HORA}px` }}>
        <div className="relative" style={{ gridTemplateColumns: '4rem repeat(7, 1fr)', display: 'grid' }}>
          {/* columna de horas */}
          <div className="border-r border-gray-100 dark:border-gray-700">
            {horas.map((h) => (
              <div
                key={h}
                className="flex items-start justify-end border-b border-gray-100 pr-2 dark:border-gray-700"
                style={{ height: PX_POR_HORA }}
              >
                <span className="mt-[-0.5em] text-xs text-gray-400 dark:text-gray-500">
                  {String(h).padStart(2, '0')}:00
                </span>
              </div>
            ))}
          </div>

          {/* columnas de dias */}
          {dias.map((dia, i) => (
            <div
              key={i}
              className={`relative ${i < 6 ? 'border-r border-gray-100 dark:border-gray-700' : ''}`}
              style={{ height: TOTAL_HORAS * PX_POR_HORA }}
            >
              {/* lineas de hora */}
              {horas.map((h) => (
                <div
                  key={h}
                  className="border-b border-gray-100 dark:border-gray-700"
                  style={{ height: PX_POR_HORA }}
                />
              ))}
              {/* eventos del dia en su horario adecuado */}
              {calcularLayoutColumnas(eventosDelDia(dia)).map((evento) => (
                <BloqueEvento key={evento.id} evento={evento} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
//  SUB-COMPONENTE: VISTA DIA
// ─────────────────────────────────────────────

function VistaDia({ fechaNav, eventos, hoy }: {
  fechaNav: Date
  eventos: EventoInterno[]
  hoy: Date
}) {
  const esHoy = mismaFecha(fechaNav, hoy)
  const horas = Array.from({ length: TOTAL_HORAS }, (_, i) => HORA_INICIO_GRILLA + i)
  const eventosDia = eventos.filter((e) => mismaFecha(e.fecha, fechaNav))

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      {/* cabecera */}
      <div className="border-b border-gray-200 py-3 text-center dark:border-gray-700">
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {DIAS_SEMANA_LABELS[fechaNav.getDay() === 0 ? 6 : fechaNav.getDay() - 1]}
        </p>
        <span
          className={`mx-auto mt-0.5 flex h-9 w-9 items-center justify-center rounded-full text-lg font-bold ${
            esHoy ? 'bg-indigo-600 text-white' : 'text-gray-700 dark:text-gray-300'
          }`}
        >
          {fechaNav.getDate()}
        </span>
      </div>

      {/* grilla */}
      <div className="overflow-y-auto" style={{ maxHeight: `${TOTAL_HORAS * PX_POR_HORA}px` }}>
        <div className="flex">
          {/* horas */}
          <div className="w-16 shrink-0 border-r border-gray-100 dark:border-gray-700">
            {horas.map((h) => (
              <div
                key={h}
                className="flex items-start justify-end border-b border-gray-100 pr-2 dark:border-gray-700"
                style={{ height: PX_POR_HORA }}
              >
                <span className="mt-[-0.5em] text-xs text-gray-400 dark:text-gray-500">
                  {String(h).padStart(2, '0')}:00
                </span>
              </div>
            ))}
          </div>

          {/* dia */}
          <div className="relative flex-1" style={{ height: TOTAL_HORAS * PX_POR_HORA }}>
            {horas.map((h) => (
              <div
                key={h}
                className="border-b border-gray-100 dark:border-gray-700"
                style={{ height: PX_POR_HORA }}
              />
            ))}
            {calcularLayoutColumnas(eventosDia).map((evento) => (
              <BloqueEvento key={evento.id} evento={evento} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
//  SUB-COMPONENTE: VISTA MES
// ─────────────────────────────────────────────

function VistaMes({ fechaNav, eventos, hoy }: {
  fechaNav: Date
  eventos: EventoInterno[]
  hoy: Date
}) {
  // primer dia del mes y primer lunes de la grilla
  const primerDiaMes = new Date(fechaNav.getFullYear(), fechaNav.getMonth(), 1)
  const primerLunes = obtenerLunesDeSemana(primerDiaMes)
  // total de celdas: 6 semanas * 7 dias = 42
  const celdas = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(primerLunes)
    d.setDate(primerLunes.getDate() + i)
    return d
  })

  function eventosDelDia(dia: Date) {
    return eventos.filter((e) => mismaFecha(e.fecha, dia))
  }

  const mesActual = fechaNav.getMonth()

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      {/* cabecera de dias */}
      <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
        {DIAS_SEMANA_LABELS.map((d) => (
          <div key={d} className="py-2 text-center text-xs font-semibold text-gray-400 dark:text-gray-500">
            {d}
          </div>
        ))}
      </div>

      {/* celdas del mes */}
      <div className="grid grid-cols-7">
        {celdas.map((dia, i) => {
          const esHoy = mismaFecha(dia, hoy)
          const esMesActual = dia.getMonth() === mesActual
          const evs = eventosDelDia(dia)

          return (
            <div
              key={i}
              className={`min-h-[88px] border-b border-r border-gray-100 p-1.5 dark:border-gray-700 ${
                i % 7 === 6 ? 'border-r-0' : ''
              } ${i >= 35 ? 'border-b-0' : ''}`}
            >
              {/* numero de dia */}
              <span
                className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                  esHoy
                    ? 'bg-indigo-600 text-white'
                    : esMesActual
                    ? 'text-gray-700 dark:text-gray-300'
                    : 'text-gray-300 dark:text-gray-600'
                }`}
              >
                {dia.getDate()}
              </span>

              {/* eventos del dia (maximo 3 visibles) */}
              <div className="space-y-0.5">
                {evs.slice(0, 3).map((e) => (
                  <div
                    key={e.id}
                    className="truncate rounded px-1 text-[10px] font-medium text-white"
                    style={{ backgroundColor: e.color }}
                    title={e.titulo}
                  >
                    {e.titulo}
                  </div>
                ))}
                {evs.length > 3 && (
                  <p className="text-[10px] text-gray-400 dark:text-gray-500">
                    +{evs.length - 3} mas
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
//  COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────

interface CalendarioCuadriculadoProps {
  comisiones: Comision[]
  // si esta definido solo muestra eventos de esa materia
  materiaDestacadaId?: number
}

export default function CalendarioCuadriculado({ comisiones, materiaDestacadaId }: CalendarioCuadriculadoProps) {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const [vista, setVista] = useState<Vista>('semana')
  const [fechaNav, setFechaNav] = useState<Date>(new Date(hoy))

  // filtra las comisiones segun la materia destacada
  const comisionesFiltradas = materiaDestacadaId
    ? comisiones.filter((c) => c.materia.id_materia === materiaDestacadaId)
    : comisiones

  // rango del periodo actual segun la vista
  function obtenerRango(): [Date, Date] {
    const inicio = new Date(fechaNav)
    const fin = new Date(fechaNav)
    if (vista === 'semana') {
      const lunes = obtenerLunesDeSemana(fechaNav)
      const domingo = new Date(lunes)
      domingo.setDate(lunes.getDate() + 6)
      return [lunes, domingo]
    }
    if (vista === 'mes') {
      return [
        new Date(fechaNav.getFullYear(), fechaNav.getMonth(), 1),
        new Date(fechaNav.getFullYear(), fechaNav.getMonth() + 1, 0),
      ]
    }
    // vista dia
    inicio.setHours(0, 0, 0, 0)
    fin.setHours(23, 59, 59, 999)
    return [inicio, fin]
  }

  const [rangoInicio, rangoFin] = obtenerRango()
  const eventos = generarEventos(comisionesFiltradas, rangoInicio, rangoFin)

  // titulo de navegacion segun vista
  function obtenerTitulo() {
    if (vista === 'mes') {
      return `${MESES[fechaNav.getMonth()]} ${fechaNav.getFullYear()}`
    }
    if (vista === 'semana') {
      const lunes = obtenerLunesDeSemana(fechaNav)
      const domingo = new Date(lunes)
      domingo.setDate(lunes.getDate() + 6)
      if (lunes.getMonth() === domingo.getMonth()) {
        return `${lunes.getDate()} - ${domingo.getDate()} ${MESES[lunes.getMonth()]} ${lunes.getFullYear()}`
      }
      return `${lunes.getDate()} ${MESES[lunes.getMonth()]} - ${domingo.getDate()} ${MESES[domingo.getMonth()]} ${domingo.getFullYear()}`
    }
    // dia
    return `${fechaNav.getDate()} de ${MESES[fechaNav.getMonth()]} ${fechaNav.getFullYear()}`
  }

  // navega hacia adelante o atras
  function navegar(direccion: 'anterior' | 'siguiente') {
    const d = new Date(fechaNav)
    if (vista === 'mes') {
      d.setMonth(d.getMonth() + (direccion === 'siguiente' ? 1 : -1))
    } else if (vista === 'semana') {
      d.setDate(d.getDate() + (direccion === 'siguiente' ? 7 : -7))
    } else {
      d.setDate(d.getDate() + (direccion === 'siguiente' ? 1 : -1))
    }
    setFechaNav(d)
  }

  return (
    <div className="flex flex-col gap-3">
      {/* barra de controles */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* navegacion de fecha */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFechaNav(new Date(hoy))}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Hoy
          </button>
          <button
            onClick={() => navegar('anterior')}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            aria-label="Periodo anterior"
          >
            ‹
          </button>
          <button
            onClick={() => navegar('siguiente')}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            aria-label="Periodo siguiente"
          >
            ›
          </button>
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            {obtenerTitulo()}
          </h2>
        </div>

        {/* selector de vista */}
        <div className="flex rounded-lg border border-gray-200 bg-white overflow-hidden dark:border-gray-600 dark:bg-gray-800">
          {(['mes', 'semana', 'dia'] as Vista[]).map((v) => (
            <button
              key={v}
              onClick={() => setVista(v)}
              className={`px-3 py-1.5 text-sm font-medium transition-colors capitalize ${
                vista === v
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* grilla del calendario segun vista activa */}
      {vista === 'semana' && (
        <VistaSemana fechaNav={fechaNav} eventos={eventos} hoy={hoy} />
      )}
      {vista === 'dia' && (
        <VistaDia fechaNav={fechaNav} eventos={eventos} hoy={hoy} />
      )}
      {vista === 'mes' && (
        <VistaMes fechaNav={fechaNav} eventos={eventos} hoy={hoy} />
      )}
    </div>
  )
}

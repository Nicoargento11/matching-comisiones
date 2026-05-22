'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseClient } from '@/src/lib/supabase'
import { comisionServicio } from '@/servicios/comisionServicio'
import CalendarioCuadriculado from '@/componentes/funcionalidades/CalendarioCuadriculado'
import SeccionAlumnos from './_componentes/SeccionAlumnos'
import SeccionHorarios from './_componentes/SeccionHorarios'
import SeccionEventos from './_componentes/SeccionEventos'
import type { Comision, Evento, Horario, UsuarioInComision } from '@/tipos'

export default function PaginaGestionComision() {
  const params = useParams()
  const id_comision = params.id_comision as string

  const [token, setToken] = useState<string | null>(null)
  const [comisionInicial, setComisionInicial] = useState<Comision | null>(null)
  const [cargando, setCargando] = useState(true)
  const [tabActivo, setTabActivo] = useState<'alumnos' | 'calendario'>('alumnos')
  const [filtroCalendario, setFiltroCalendario] = useState<'ambos' | 'horarios' | 'eventos'>('ambos')

  const [alumnos, setAlumnos] = useState<UsuarioInComision[]>([])
  const [alumnosDadosDeBaja, setAlumnosDadosDeBaja] = useState<UsuarioInComision[]>([])
  const [horarios, setHorarios] = useState<Horario[]>([])
  const [horariosDadosDeBaja, setHorariosDadosDeBaja] = useState<Horario[]>([])
  const [eventos, setEventos] = useState<Evento[]>([])
  const [eventosDadosDeBaja, setEventosDadosDeBaja] = useState<Evento[]>([])

  useEffect(() => {
    async function cargar() {
      const { data } = await getSupabaseClient().auth.getSession()
      const t = data.session?.access_token ?? null
      setToken(t)
      const c = await comisionServicio.obtenerPorId(Number(id_comision), t ?? undefined)
      setComisionInicial(c)
      const todos = (c.usuarios ?? []) as UsuarioInComision[]
      setAlumnos(todos.filter((u) => u.estado === 'ACTIVO'))
      setAlumnosDadosDeBaja(todos.filter((u) => u.estado === 'BAJA'))
      setHorarios(c.horarios.filter((h) => h.activo))
      setHorariosDadosDeBaja(c.horarios.filter((h) => !h.activo))
      setEventos((c.eventos ?? []).filter((e) => e.activo))
      setEventosDadosDeBaja((c.eventos ?? []).filter((e) => !e.activo))
    }
    cargar().catch(() => setComisionInicial(null)).finally(() => setCargando(false))
  }, [id_comision])

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-gray-400 dark:text-gray-500">Cargando...</p>
      </div>
    )
  }

  if (!comisionInicial) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-gray-500 dark:text-gray-400">No se encontro la comision</p>
        <Link href="/profesor" className="mt-4 text-sm text-indigo-600 hover:underline dark:text-indigo-400">
          Volver a mis comisiones
        </Link>
      </div>
    )
  }

  const profesor = comisionInicial.profesor
  const comisionActualizada: Comision = { ...comisionInicial, horarios, eventos }

  return (
    <div className="space-y-8">
      <Link
        href="/profesor"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
      >
        ← Mis comisiones
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Prof. {profesor.nombre_usuario} {profesor.apellido_usuario}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{profesor.correo}</p>
        </div>

        <div
          className="self-start rounded-xl border px-4 py-3"
          style={{ borderColor: comisionInicial.materia.color + '40', backgroundColor: comisionInicial.materia.color + '10' }}
        >
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{comisionInicial.materia.nombre_materia}</p>
          {comisionInicial.numero_comision != null && (
            <p className="text-xs text-gray-500 dark:text-gray-400">Comision {comisionInicial.numero_comision}</p>
          )}
        </div>
      </div>

      <div className="flex gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
        {([
          { key: 'alumnos', label: 'Alumnos', count: alumnos.length },
          { key: 'calendario', label: 'Calendario', count: horarios.length + eventos.length },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setTabActivo(tab.key)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              tabActivo === tab.key
                ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            {tab.label}
            <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {tabActivo === 'alumnos' && (
        <SeccionAlumnos
          alumnosIniciales={alumnos}
          alumnosBajaIniciales={alumnosDadosDeBaja}
          comision={comisionInicial}
          token={token}
          onAlumnosChange={(activos, bajas) => {
            setAlumnos(activos)
            setAlumnosDadosDeBaja(bajas)
          }}
        />
      )}

      {tabActivo === 'calendario' && (
        <div className="space-y-8">
          <div className="flex gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
            {([
              { key: 'ambos', label: 'Ambos', count: horarios.length + eventos.length },
              { key: 'horarios', label: 'Horarios', count: horarios.length },
              { key: 'eventos', label: 'Eventos', count: eventos.length },
            ] as const).map((f) => (
              <button
                key={f.key}
                onClick={() => setFiltroCalendario(f.key)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  filtroCalendario === f.key
                    ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                {f.label}
                <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                  {f.count}
                </span>
              </button>
            ))}
          </div>

          {filtroCalendario !== 'eventos' && (
            <SeccionHorarios
              horariosIniciales={horarios}
              horariosBajaIniciales={horariosDadosDeBaja}
              comision={comisionInicial}
              token={token}
              onHorariosChange={(activos, bajas) => {
                setHorarios(activos)
                setHorariosDadosDeBaja(bajas)
              }}
            />
          )}

          {filtroCalendario !== 'horarios' && (
            <SeccionEventos
              eventosIniciales={eventos}
              eventosBajaIniciales={eventosDadosDeBaja}
              comision={comisionInicial}
              token={token}
              onEventosChange={(activos, bajas) => {
                setEventos(activos)
                setEventosDadosDeBaja(bajas)
              }}
            />
          )}

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200">Vista del calendario</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Asi ven los estudiantes el calendario de esta comision</p>
            <CalendarioCuadriculado comisiones={[comisionActualizada]} materiaDestacadaId={comisionInicial.materia.id_materia} />
          </section>
        </div>
      )}
    </div>
  )
}

'use client'

// contenido de la pagina de calendario
// grilla tipo google calendar a la izquierda y cards de materias a la derecha
import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import CalendarioCuadriculado from './CalendarioCuadriculado'
import InsigniaHorario from '@/componentes/interfaz/InsigniaHorario'
import InsigniaModalidad from '@/componentes/interfaz/InsigniaModalidad'
import { usuarioServicio } from '@/servicios/usuarioServicio'
import { api } from '@/servicios/api'
import { getSupabaseClient } from '@/src/lib/supabase'
import { Comision, Usuario } from '@/tipos'

const nombreDiaCorto = (nombre: string) => nombre.substring(0, 3)

export default function ContenidoCalendario() {
  const searchParams = useSearchParams()
  const router = useRouter()
  // el param ?materia=id viene desde la navegacion del detalle de comision
  const materiaFiltradaIdStr = searchParams.get('materia')
  const materiaFiltradaId = materiaFiltradaIdStr ? Number(materiaFiltradaIdStr) : undefined

  const [comisiones, setComisiones] = useState<Comision[]>([])

  useEffect(() => {
    async function cargar() {
      const { data } = await getSupabaseClient().auth.getSession()
      const token = data.session?.access_token
      if (!token) return

      const usuario = await api.get<Usuario>('/auth/me', token)
      const data2 = await usuarioServicio.obtenerComisiones(usuario.id_usuario, token)
      setComisiones(data2)
    }
    cargar().catch(() => setComisiones([]))
  }, [])

  const materiaFiltrada = materiaFiltradaId != null
    ? comisiones.find((c) => c.materia.id_materia === materiaFiltradaId)?.materia
    : undefined

  function filtrarPorMateria(idMateria: number) {
    router.push(`/calendario?materia=${idMateria}`)
  }

  function mostrarTodas() {
    router.push('/calendario')
  }

  return (
    <div className="space-y-6">
      {/* encabezado */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Mi Calendario
          </h1>
          {materiaFiltrada ? (
            <p className="mt-1 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              Mostrando solo:
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
                style={{ backgroundColor: materiaFiltrada.color }}
              >
                {materiaFiltrada.nombre_materia}
              </span>
            </p>
          ) : (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Todos tus horarios, clases y eventos
            </p>
          )}
        </div>

        <Link
          href="/perfil"
          className="flex items-center gap-1.5 self-start rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          ← Volver al perfil
        </Link>
      </div>

      {/* layout principal */}
      <div className="flex flex-col gap-6 xl:flex-row">
        <div className="min-w-0 flex-1">
          <CalendarioCuadriculado
            comisiones={comisiones}
            materiaDestacadaId={materiaFiltradaId}
          />
        </div>

        {/* sidebar de materias */}
        <div className="shrink-0 space-y-3 xl:w-72">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Mis Materias
            </h2>
            {materiaFiltradaId != null && (
              <button
                onClick={mostrarTodas}
                className="text-xs font-medium text-indigo-500 transition-colors hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                Mostrar todas
              </button>
            )}
          </div>

          {comisiones.map((comision) => {
            const esFiltrada = materiaFiltradaId === comision.materia.id_materia
            return (
              <div
                key={comision.id_comision}
                onClick={() => filtrarPorMateria(comision.materia.id_materia)}
                className={`relative cursor-pointer overflow-hidden rounded-xl border bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:bg-gray-800 ${
                  esFiltrada
                    ? 'border-2 dark:border-opacity-80'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                }`}
                style={esFiltrada ? { borderColor: comision.materia.color } : {}}
              >
                <div
                  className="absolute left-0 top-0 h-full w-1 rounded-l-xl"
                  style={{ backgroundColor: comision.materia.color }}
                />

                <div className="pl-3">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {comision.materia.nombre_materia}
                    </p>
                    {comision.numero_comision != null && (
                      <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                        Com. {comision.numero_comision}
                      </span>
                    )}
                  </div>

                  <div className="mb-3 flex flex-wrap gap-1">
                    {comision.horarios.map((h) => (
                      <span
                        key={h.id_horario_comision}
                        className="flex items-center gap-1 rounded-md bg-gray-50 px-1.5 py-0.5 text-xs text-gray-500 dark:bg-gray-700/50 dark:text-gray-400"
                      >
                        <span className="font-medium">{nombreDiaCorto(h.dia.nombre_dia)}</span>
                        <span>{h.hora_inicio}–{h.hora_fin}</span>
                        <InsigniaHorario formato={h.formato} />
                        <InsigniaModalidad modalidad={h.modalidad.nombre_modalidad} />
                      </span>
                    ))}
                  </div>

                  <Link
                    href={`/comision/${comision.id_comision}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs font-medium text-indigo-500 transition-colors hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                  >
                    Ver detalle →
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

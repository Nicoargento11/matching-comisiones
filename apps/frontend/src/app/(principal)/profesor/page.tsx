import Link from 'next/link'
import { redirect } from 'next/navigation'
import { profesorServicio } from '@/servicios/profesorServicio'
import { api } from '@/servicios/api'
import { getServerSession } from '@/lib/supabase-server'
import { Usuario } from '@/tipos'

export default async function PaginaMisComisiones() {
  const session = await getServerSession()
  if (!session) redirect('/login')

  const token = session.access_token
  const profesor = await api.get<Usuario>('/auth/me', token)
  const comisiones = await profesorServicio.obtenerComisiones(profesor.id_usuario, token)

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Prof. {profesor.nombre_usuario} {profesor.apellido_usuario}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{profesor.correo}</p>
      </div>

      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Mis Comisiones</h2>
        <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-sm font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
          {comisiones.length}
        </span>
      </div>

      {comisiones.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-16 text-center dark:border-gray-600">
          <p className="text-gray-400 dark:text-gray-500">No tenés comisiones asignadas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {comisiones.map((comision) => (
            <Link
              key={comision.id_comision}
              href={`/profesor/${comision.id_comision}`}
              className="group block focus:outline-none"
            >
              <article className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group-focus-visible:ring-2 group-focus-visible:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800">
                <div
                  className="absolute left-0 top-0 h-full w-1 rounded-l-xl"
                  style={{ backgroundColor: comision.materia.color }}
                />
                <div className="pl-3">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      {comision.materia.nombre_materia}
                    </h3>
                    {comision.numero_comision != null && (
                      <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-sm font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                        Com. {comision.numero_comision}
                      </span>
                    )}
                  </div>

                  <p className="mb-3 flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0">
                      <path d="M7 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM14.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM1.615 16.428a1.224 1.224 0 0 1-.569-1.175 6.002 6.002 0 0 1 11.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 0 1 7 18a9.953 9.953 0 0 1-5.385-1.572ZM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 0 0-1.588-3.755 4.502 4.502 0 0 1 5.874 2.636.818.818 0 0 1-.36.98A7.465 7.465 0 0 1 14.5 16Z" />
                    </svg>
                    {comision.usuarios?.length ?? 0} alumnos
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {comision.horarios.map((h) => (
                      <span
                        key={h.id_horario_comision}
                        className="flex items-center gap-1 rounded-md bg-gray-50 px-2 py-1 text-xs text-gray-600 dark:bg-gray-700/50 dark:text-gray-400"
                      >
                        <span className="font-medium">{h.dia.nombre_dia.substring(0, 3)}</span>
                        <span>{h.hora_inicio}–{h.hora_fin}</span>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-3 flex justify-end">
                  <span className="text-xs text-gray-400 transition-colors group-hover:text-indigo-500 dark:text-gray-500">
                    Gestionar →
                  </span>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

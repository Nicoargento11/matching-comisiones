// vista de detalle de una comision especifica
import Link from 'next/link'
import { notFound } from 'next/navigation'
import InsigniaHorario from '@/componentes/interfaz/InsigniaHorario'
import InsigniaModalidad from '@/componentes/interfaz/InsigniaModalidad'
import { comisionServicio } from '@/servicios/comisionServicio'

interface Props {
  params: Promise<{ id_comision: string }>
}

export default async function paginaDetalleComision({ params }: Props) {
  const { id_comision } = await params

  const comision = await comisionServicio.obtenerPorId(Number(id_comision)).catch(() => null)

  if (!comision) notFound()

  const { materia, numero_comision, profesor, horarios } = comision

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* navegacion de retorno */}
      <Link
        href="/perfil"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
      >
        ← Volver al perfil
      </Link>

      {/* encabezado de la comision */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        {/* barra superior con el color de la materia */}
        <div className="h-2 w-full" style={{ backgroundColor: materia.color }} />

        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {materia.nombre_materia}
          </h1>
          {numero_comision != null && (
            <p className="mt-1 text-base text-gray-500 dark:text-gray-400">
              Comision {numero_comision}
            </p>
          )}
        </div>
      </div>

      {/* grilla de informacion */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* profesor a cargo */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-500 uppercase tracking-wide dark:text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" />
            </svg>
            Profesor
          </div>
          <p className="text-base font-medium text-gray-900 dark:text-gray-100">
            {profesor.nombre_usuario} {profesor.apellido_usuario}
          </p>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {profesor.correo}
          </p>
        </div>
      </div>

      {/* lista de horarios */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-700">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13a.75.75 0 0 0-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 0 0 0-1.5h-3.25V5Z" clipRule="evenodd" />
            </svg>
            Horarios
          </h2>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {horarios.map((horario) => (
            <div key={horario.id_horario_comision} className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="w-20 text-sm font-medium text-gray-700 dark:text-gray-300">
                  {horario.dia.nombre_dia}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {horario.hora_inicio} – {horario.hora_fin}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {horario.aula && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {horario.aula.nombre}
                  </span>
                )}
                <InsigniaHorario formato={horario.formato} />
                <InsigniaModalidad modalidad={horario.modalidad.nombre_modalidad} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* boton para ver en el calendario destacado */}
      <div className="flex justify-end">
        <Link
          href={`/calendario?materia=${materia.id_materia}`}
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90"
          style={{ backgroundColor: materia.color }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path fillRule="evenodd" d="M5.75 2a.75.75 0 0 1 .75.75V4h7V2.75a.75.75 0 0 1 1.5 0V4h.25A2.75 2.75 0 0 1 18 6.75v8.5A2.75 2.75 0 0 1 15.25 18H4.75A2.75 2.75 0 0 1 2 15.25v-8.5A2.75 2.75 0 0 1 4.75 4H5V2.75A.75.75 0 0 1 5.75 2Zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75Z" clipRule="evenodd" />
          </svg>
          Ver en Calendario
        </Link>
      </div>
    </div>
  )
}

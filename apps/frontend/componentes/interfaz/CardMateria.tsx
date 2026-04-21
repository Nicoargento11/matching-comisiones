'use client'

// card de materia que muestra un resumen de la comision inscripta
import Link from 'next/link'
import { Comision } from '@/tipos'
import InsigniaHorario from './InsigniaHorario'

interface CardMateriaProps {
  comision: Comision
}

export default function CardMateria({ comision }: CardMateriaProps) {
  const { materia, numero_comision, profesor, horarios, id_comision } = comision

  return (
    <Link href={`/comision/${id_comision}`} className="group block focus:outline-none">
      <article
        className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group-focus-visible:ring-2 group-focus-visible:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800"
      >
        {/* barra de color de la materia en el borde izquierdo */}
        <div
          className="absolute left-0 top-0 h-full w-1 rounded-l-xl"
          style={{ backgroundColor: materia.color }}
        />

        <div className="pl-3">
          {/* encabezado con nombre y numero de comision */}
          <div className="mb-3 flex items-start justify-between gap-2">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {materia.nombre_materia}
            </h3>
            {numero_comision != null && (
              <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-sm font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                Com. {numero_comision}
              </span>
            )}
          </div>

          {/* profesor a cargo */}
          <p className="mb-3 flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0">
              <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" />
            </svg>
            {profesor.nombre_usuario} {profesor.apellido_usuario}
          </p>

          {/* horarios resumidos */}
          <div className="flex flex-wrap gap-1.5">
            {horarios.map((h) => (
              <span
                key={h.id_horario_comision}
                className="flex items-center gap-1 rounded-md bg-gray-50 px-2 py-1 text-xs text-gray-600 dark:bg-gray-700/50 dark:text-gray-400"
              >
                <span className="font-medium">{h.dia.nombre_dia.substring(0, 3)}</span>
                <span>{h.hora_inicio}–{h.hora_fin}</span>
                <InsigniaHorario formato={h.formato} />
              </span>
            ))}
          </div>
        </div>

        {/* flecha de accion */}
        <div className="mt-3 flex justify-end">
          <span className="text-xs text-gray-400 transition-colors group-hover:text-indigo-500 dark:text-gray-500">
            Ver detalle →
          </span>
        </div>
      </article>
    </Link>
  )
}

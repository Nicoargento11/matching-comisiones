'use client'

// calendario semanal con bloques de color por materia
// cada materia tiene su propio color de referencia
import { Comision } from '@/tipos'
import InsigniaHorario from '@/componentes/interfaz/InsigniaHorario'

interface CalendarioSemanalProps {
  comisiones: Comision[]
  // id de la materia a resaltar (viene de la navegacion)
  materiaDestacadaId?: string
}

const diasSemana = [
  { key: 'lunes',     label: 'Lunes' },
  { key: 'martes',    label: 'Martes' },
  { key: 'miercoles', label: 'Miercoles' },
  { key: 'jueves',    label: 'Jueves' },
  { key: 'viernes',   label: 'Viernes' },
  { key: 'sabado',    label: 'Sabado' },
]

interface BloqueCalendario {
  comisionId: string
  materiaId: string
  materiaNombre: string
  materiaCodigo: string
  color: string
  horaInicio: string
  horaFin: string
  aula: string
  tipo: string
}

// construye el mapa de dia → lista de bloques ordenados por hora
function construirMapaDias(comisiones: Comision[]): Record<string, BloqueCalendario[]> {
  const mapa: Record<string, BloqueCalendario[]> = {}

  for (const comision of comisiones) {
    for (const horario of comision.horarios) {
      if (!mapa[horario.dia]) mapa[horario.dia] = []
      mapa[horario.dia].push({
        comisionId: comision.id,
        materiaId: comision.materia.id,
        materiaNombre: comision.materia.nombre,
        materiaCodigo: comision.materia.codigo,
        color: comision.materia.color,
        horaInicio: horario.horaInicio,
        horaFin: horario.horaFin,
        aula: horario.aula,
        tipo: horario.tipo,
      })
    }
  }

  // ordenar cada dia por hora de inicio
  for (const dia of Object.keys(mapa)) {
    mapa[dia].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
  }

  return mapa
}

export default function CalendarioSemanal({ comisiones, materiaDestacadaId }: CalendarioSemanalProps) {
  const mapaDias = construirMapaDias(comisiones)
  const diasConClases = diasSemana.filter((d) => mapaDias[d.key]?.length > 0)

  if (diasConClases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-16 text-center dark:border-gray-600">
        <p className="text-gray-400 dark:text-gray-500">No hay horarios registrados</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* leyenda de materias */}
      <div className="flex flex-wrap gap-3">
        {comisiones.map((c) => {
          const esDestacada = materiaDestacadaId === c.materia.id
          return (
            <span
              key={c.id}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                esDestacada
                  ? 'scale-105 border-transparent shadow-md'
                  : 'border-gray-200 bg-white text-gray-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'
              }`}
              style={
                esDestacada
                  ? { backgroundColor: c.materia.color, color: '#fff' }
                  : {}
              }
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: c.materia.color }}
              />
              {c.materia.nombre}
            </span>
          )
        })}
      </div>

      {/* grilla de dias */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {diasSemana.map((dia) => {
          const bloques = mapaDias[dia.key] ?? []
          if (bloques.length === 0) return null

          return (
            <div
              key={dia.key}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
            >
              {/* cabecera del dia */}
              <div className="border-b border-gray-100 bg-gray-50 px-4 py-2 dark:border-gray-700 dark:bg-gray-700/50">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {dia.label}
                </h3>
              </div>

              {/* bloques de clases del dia */}
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {bloques.map((bloque, i) => {
                  const esDestacada = materiaDestacadaId === bloque.materiaId
                  return (
                    <div
                      key={i}
                      className={`relative px-4 py-3 transition-colors ${
                        esDestacada ? 'bg-opacity-10' : ''
                      }`}
                      style={esDestacada ? { backgroundColor: bloque.color + '15' } : {}}
                    >
                      {/* barra lateral de color */}
                      <div
                        className="absolute left-0 top-0 h-full w-1"
                        style={{ backgroundColor: bloque.color }}
                      />

                      <div className="pl-2">
                        {/* codigo y nombre de la materia */}
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <span
                            className="text-xs font-bold"
                            style={{ color: bloque.color }}
                          >
                            {bloque.materiaCodigo}
                          </span>
                          <InsigniaHorario tipo={bloque.tipo as any} />
                        </div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {bloque.materiaNombre}
                        </p>

                        {/* horario y aula */}
                        <div className="mt-1 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            {/* icono reloj */}
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                              <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13a.75.75 0 0 0-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 0 0 0-1.5h-3.25V5Z" clipRule="evenodd" />
                            </svg>
                            {bloque.horaInicio} – {bloque.horaFin}
                          </span>
                          <span className="flex items-center gap-1">
                            {/* icono ubicacion */}
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                              <path fillRule="evenodd" d="m9.69 18.933.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 0 0 .281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 1 0 3 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 0 0 2.273 1.765 11.842 11.842 0 0 0 .976.544l.062.029.018.008.006.003ZM10 11.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" clipRule="evenodd" />
                            </svg>
                            {bloque.aula}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

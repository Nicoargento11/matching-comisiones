// insignia visual para el formato de clase de un horario
import { FormatoClase } from '@/tipos'

interface InsigniaHorarioProps {
  formato: FormatoClase
}

const estilosPorFormato: Record<FormatoClase, string> = {
  TEORICO:           'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  PRACTICO:          'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  TEORICO_PRACTICO:  'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
}

const etiquetasPorFormato: Record<FormatoClase, string> = {
  TEORICO:          'Teorico',
  PRACTICO:         'Practico',
  TEORICO_PRACTICO: 'Teo/Prac',
}

export default function InsigniaHorario({ formato }: InsigniaHorarioProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${estilosPorFormato[formato]}`}
    >
      {etiquetasPorFormato[formato]}
    </span>
  )
}

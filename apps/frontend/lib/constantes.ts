import type { FormatoClase, TipoEvento } from '@/tipos'

export const HORA_MINIMA_HORARIO = '07:00'
export const HORA_MAXIMA_HORARIO = '22:00'

export const DIAS_SEMANA = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado']
export const FORMATOS_CLASE: FormatoClase[] = ['TEORICO', 'PRACTICO', 'TEORICO_PRACTICO']
export const MODALIDADES = ['presencial', 'virtual', 'hibrido']
export const TIPOS_EVENTO: TipoEvento[] = ['PARCIAL', 'ENTREGA_TP', 'OTRO']

export const etiquetaFormato: Record<FormatoClase, string> = {
  TEORICO: 'Teorico',
  PRACTICO: 'Practico',
  TEORICO_PRACTICO: 'Teo/Prac',
}

export const etiquetaEvento: Record<TipoEvento, string> = {
  CLASE: 'Clase',
  PARCIAL: 'Parcial',
  ENTREGA_TP: 'Entrega TP',
  OTRO: 'Otro',
}

export const colorEvento: Record<TipoEvento, string> = {
  CLASE: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  PARCIAL: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  ENTREGA_TP: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  OTRO: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400',
}

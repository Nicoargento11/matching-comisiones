// insignia visual para la modalidad de cursado de un horario
// recibe nombre_modalidad directamente desde el objeto Modalidad del backend

interface InsigniaModalidadProps {
  modalidad: string // nombre_modalidad del backend (ej: 'presencial', 'virtual', 'hibrido')
}

const estilosPorModalidad: Record<string, string> = {
  presencial: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  virtual:    'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  hibrido:    'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
}

const etiquetasPorModalidad: Record<string, string> = {
  presencial: 'Presencial',
  virtual:    'Virtual',
  hibrido:    'Hibrido',
}

export default function InsigniaModalidad({ modalidad }: InsigniaModalidadProps) {
  const clave = modalidad.toLowerCase()
  const estilos = estilosPorModalidad[clave] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
  const etiqueta = etiquetasPorModalidad[clave] ?? modalidad

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${estilos}`}>
      {etiqueta}
    </span>
  )
}

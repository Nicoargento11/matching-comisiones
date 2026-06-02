import TableroKanban from '@/componentes/funcionalidades/TableroKanban'
import BotonVolver from '@/componentes/interfaz/BotonVolver'

export default function PaginaTablero() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BotonVolver />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Mi tablero</h1>
      </div>
      <TableroKanban />
    </div>
  )
}

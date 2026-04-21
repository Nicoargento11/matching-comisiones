// vista del perfil del estudiante con sus comisiones inscriptas
import Link from 'next/link'
import CardMateria from '@/componentes/interfaz/CardMateria'
import { usuarioServicio } from '@/servicios/usuarioServicio'

export default async function PaginaPerfil() {
  let ID_USUARIO: number;
  try {
    ID_USUARIO = await usuarioServicio.obtenerIdPrimerEstudiante();
  } catch (error) {
    return <div className="p-8 text-center text-red-500">Error: No hay estudiantes cargados en la base de datos local o remota.</div>;
  }

  const [usuario, comisiones] = await Promise.all([
    usuarioServicio.obtenerPorId(ID_USUARIO),
    usuarioServicio.obtenerComisiones(ID_USUARIO),
  ])

  return (
    <div className="space-y-8">
      {/* encabezado del perfil */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        {/* datos del estudiante */}
        <div className="flex items-center gap-4">
          {/* avatar con iniciales */}
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xl font-bold text-white shadow-md">
            {usuario.nombre_usuario[0]}{usuario.apellido_usuario[0]}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {usuario.nombre_usuario} {usuario.apellido_usuario}
            </h1>
            <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
              ID: {usuario.id_usuario}
            </p>
          </div>
        </div>

        {/* acciones del estudiante */}
        <Link
          href="/calendario"
          className="flex self-start items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400 dark:hover:bg-indigo-900/40"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
            <path fillRule="evenodd" d="M5.75 2a.75.75 0 0 1 .75.75V4h7V2.75a.75.75 0 0 1 1.5 0V4h.25A2.75 2.75 0 0 1 18 6.75v8.5A2.75 2.75 0 0 1 15.25 18H4.75A2.75 2.75 0 0 1 2 15.25v-8.5A2.75 2.75 0 0 1 4.75 4H5V2.75A.75.75 0 0 1 5.75 2Zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75Z" clipRule="evenodd" />
          </svg>
          Calendario
        </Link>
      </div>

      {/* separador con contador de materias */}
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Mis Materias
        </h2>
        <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-sm font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
          {comisiones.length}
        </span>
      </div>

      {/* grilla de cards de materias */}
      {comisiones.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {comisiones.map((comision) => (
            <CardMateria key={comision.id_comision} comision={comision} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-16 text-center dark:border-gray-600">
          <p className="text-gray-400 dark:text-gray-500">
            No tenes materias inscriptas por el momento
          </p>
        </div>
      )}
    </div>
  )
}

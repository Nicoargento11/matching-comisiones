'use client'

// barra de navegacion superior del sistema SIC con toggle de tema y boton de sesion
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function Navbar() {
  const router = useRouter()
  const [oscuro, setOscuro] = useState(false)
  // evita el flash mientras se detecta el tema inicial
  const [montado, setMontado] = useState(false)

  useEffect(() => {
    setOscuro(document.documentElement.classList.contains('dark'))
    setMontado(true)
  }, [])

  // alterna entre tema claro y oscuro
  function alternarTema() {
    const nuevoOscuro = !oscuro
    setOscuro(nuevoOscuro)
    if (nuevoOscuro) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('tema-sic', 'oscuro')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('tema-sic', 'claro')
    }
  }

  // cierra la sesion y redirige al login
  function cerrarSesion() {
    // TODO conectar con el servicio de autenticacion de NestJS/Supabase
    localStorage.removeItem('tema-sic')
    router.push('/login')
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/90 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/90">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* nombre del sistema */}
        <Link
          href="/perfil"
          className="text-xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400"
        >
          SIC
        </Link>

        <div className="flex items-center gap-2">
          {/* icono de mensajeria - accesible desde cualquier vista */}
          <Link
            href="/mensajes"
            aria-label="Mensajes"
            title="Mensajes"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-indigo-500 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-400"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path fillRule="evenodd" d="M3.43 2.524A41.29 41.29 0 0 1 10 2c2.236 0 4.43.18 6.57.524 1.437.231 2.43 1.49 2.43 2.902v5.148c0 1.413-.993 2.67-2.43 2.902a41.202 41.202 0 0 1-5.183.501.78.78 0 0 0-.528.224l-3.579 3.58A.75.75 0 0 1 6 17.75v-2.824c-.528-.055-1.052-.12-1.57-.195C2.993 14.42 2 13.163 2 11.75V5.426c0-1.413.993-2.67 2.43-2.902Z" clipRule="evenodd" />
            </svg>
          </Link>

          {/* toggle de tema claro/oscuro */}
          {montado && (
            <button
              onClick={alternarTema}
              aria-label={oscuro ? 'Activar modo claro' : 'Activar modo oscuro'}
              title={oscuro ? 'Modo claro' : 'Modo oscuro'}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-indigo-500 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-400"
            >
              {oscuro ? (
                /* icono sol - modo claro */
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path d="M10 2a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 2ZM10 15a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 15ZM10 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM15.657 5.404a.75.75 0 1 0-1.06-1.06l-1.061 1.06a.75.75 0 0 0 1.06 1.06l1.06-1.06ZM6.464 14.596a.75.75 0 1 0-1.06-1.06l-1.06 1.06a.75.75 0 0 0 1.06 1.06l1.06-1.06ZM18 10a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 18 10ZM5 10a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 5 10ZM14.596 15.657a.75.75 0 0 0 1.06-1.06l-1.06-1.061a.75.75 0 1 0-1.06 1.06l1.06 1.061ZM5.404 6.464a.75.75 0 0 0 1.06-1.06l-1.06-1.06a.75.75 0 1 0-1.061 1.06l1.061 1.06Z" />
                </svg>
              ) : (
                /* icono luna - modo oscuro */
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M7.455 2.004a.75.75 0 0 1 .26.77 7 7 0 0 0 9.958 7.967.75.75 0 0 1 1.067.853A8.5 8.5 0 1 1 6.647 1.921a.75.75 0 0 1 .808.083Z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          )}

          {/* boton de perfil / cerrar sesion */}
          <button
            onClick={cerrarSesion}
            aria-label="Cerrar sesion"
            title="Cerrar sesion"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-600 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-red-500 dark:hover:bg-red-900/30 dark:hover:text-red-400"
          >
            {/* icono de persona */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}

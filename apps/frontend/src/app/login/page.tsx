'use client'

// vista de inicio de sesion del sistema SIC
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PaginaLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  // maneja el envio del formulario de login
  async function manejarLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!email || !contrasena) {
      setError('Completa todos los campos')
      return
    }

    setCargando(true)

    try {
      // TODO conectar con el servicio de autenticacion de NestJS/Supabase
      await new Promise((r) => setTimeout(r, 800)) // simula llamada a API
      router.push('/perfil')
    } catch {
      setError('Credenciales invalidas. Intenta nuevamente.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4 dark:from-gray-900 dark:via-gray-950 dark:to-indigo-950">
      <div className="w-full max-w-sm">
        {/* logo y titulo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/40">
            <span className="text-2xl font-bold text-white">S</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Bienvenido a SIC
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Sistema de Intercambio de Comisiones
          </p>
        </div>

        {/* tarjeta del formulario */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
          <form onSubmit={manejarLogin} noValidate className="space-y-5 p-8">
            {/* campo de email */}
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Correo electronico
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nombre@universidad.edu.ar"
                className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-indigo-400"
              />
            </div>

            {/* campo de contrasena */}
            <div>
              <label
                htmlFor="contrasena"
                className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Contrasena
              </label>
              <input
                id="contrasena"
                type="password"
                autoComplete="current-password"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-indigo-400"
              />
            </div>

            {/* mensaje de error */}
            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}

            {/* boton de ingreso */}
            <button
              type="submit"
              disabled={cargando}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-gray-800"
            >
              {cargando ? (
                <>
                  {/* spinner de carga */}
                  <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Ingresando...
                </>
              ) : (
                'Ingresar'
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400 dark:text-gray-600">
          SIC &mdash; Sistema de Intercambio de Comisiones
        </p>
      </div>
    </div>
  )
}

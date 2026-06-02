import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function crearClienteServidor(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // en Server Components no se pueden setear cookies
          }
        },
      },
    },
  )
}

// Valida la sesión leyendo la cookie (rápido, sin llamada al servidor de Supabase).
// Usar para obtener el access_token en Server Components que ya están protegidos por un layout.
export async function getServerSession() {
  const cookieStore = await cookies()
  const supabase = crearClienteServidor(cookieStore)
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

// Valida la sesión contra el servidor de Supabase (más seguro que getServerSession).
// Usar en layouts como gate de autenticación y autorización.
// Devuelve null en user si el token es inválido o expiró, aunque exista la cookie.
export async function getServerUser() {
  const cookieStore = await cookies()
  const supabase = crearClienteServidor(cookieStore)

  const [{ data: { user } }, { data: { session } }] = await Promise.all([
    supabase.auth.getUser(),   // valida contra servidor — fuente de verdad de autenticación
    supabase.auth.getSession(), // lee cookie local — necesario para obtener el access_token
  ])

  return { user, session }
}

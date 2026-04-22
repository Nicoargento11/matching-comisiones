import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { api } from '@/servicios/api'

export default async function LayoutProfesor({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {}
        },
      },
    },
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) redirect('/perfil')

  try {
    const usuario = await api.get<{ roles: { nombre_rol: string }[] }>(
      '/auth/me',
      session.access_token,
    )
    const esProfesor = usuario.roles.some((r) => r.nombre_rol === 'profesor')
    if (!esProfesor) redirect('/perfil')
  } catch {
    redirect('/perfil')
  }

  return <>{children}</>
}

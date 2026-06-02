import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/supabase-server'
import { api } from '@/servicios/api'

export default async function LayoutAlumno({ children }: { children: React.ReactNode }) {
  const { user, session } = await getServerUser()
  if (!user || !session?.access_token) redirect('/login')

  try {
    const usuario = await api.get<{ roles: { nombre_rol: string }[] }>('/auth/me', session.access_token)
    if (usuario.roles.some((r) => r.nombre_rol === 'profesor')) redirect('/profesor')
  } catch {
    redirect('/login')
  }

  return <>{children}</>
}

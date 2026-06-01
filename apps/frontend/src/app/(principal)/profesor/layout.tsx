import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/supabase-server'
import { api } from '@/servicios/api'

export default async function LayoutProfesor({ children }: { children: React.ReactNode }) {
  const { user, session } = await getServerUser()
  if (!user) redirect('/login')
  if (!session?.access_token) redirect('/perfil')

  try {
    const usuario = await api.get<{ roles: { nombre_rol: string }[] }>('/auth/me', session.access_token)
    if (!usuario.roles.some((r) => r.nombre_rol === 'profesor')) redirect('/perfil')
  } catch {
    // si el backend no responde o el token es inválido, bloqueamos el acceso
    redirect('/perfil')
  }

  return <>{children}</>
}

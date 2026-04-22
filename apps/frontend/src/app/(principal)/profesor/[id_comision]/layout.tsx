import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { api } from '@/servicios/api'

interface Props {
  children: React.ReactNode
  params: Promise<{ id_comision: string }>
}

type UsuarioMe = {
  id_usuario: number
  roles: { nombre_rol: string }[]
}

type ComisionDetalle = {
  profesor: { id_usuario: number }
}

export default async function LayoutGestionComision({ children, params }: Props) {
  const { id_comision } = await params
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

  let usuario: UsuarioMe
  try {
    usuario = await api.get<UsuarioMe>('/auth/me', session.access_token)
  } catch {
    redirect('/perfil')
  }

  const esProfesor = usuario.roles.some((r) => r.nombre_rol === 'profesor')
  if (!esProfesor) redirect('/perfil')

  let comision: ComisionDetalle
  try {
    comision = await api.get<ComisionDetalle>(`/comisiones/${id_comision}`, session.access_token)
  } catch {
    redirect('/profesor')
  }

  if (comision.profesor.id_usuario !== usuario.id_usuario) {
    redirect('/profesor')
  }

  return <>{children}</>
}

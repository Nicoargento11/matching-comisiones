import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/supabase-server'
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
  const { user, session } = await getServerUser()

  if (!user) redirect('/login')
  if (!session?.access_token) redirect('/perfil')

  let usuario: UsuarioMe
  try {
    usuario = await api.get<UsuarioMe>('/auth/me', session.access_token)
  } catch {
    redirect('/perfil')
  }

  if (!usuario.roles.some((r) => r.nombre_rol === 'profesor')) redirect('/perfil')

  let comision: ComisionDetalle
  try {
    comision = await api.get<ComisionDetalle>(`/comisiones/${id_comision}`, session.access_token)
  } catch {
    redirect('/profesor')
  }

  // verifica que la comision pertenezca al profesor autenticado
  if (comision.profesor.id_usuario !== usuario.id_usuario) redirect('/profesor')

  return <>{children}</>
}

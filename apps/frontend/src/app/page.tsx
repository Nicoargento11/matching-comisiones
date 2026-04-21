// pagina raiz - redirige al login
import { redirect } from 'next/navigation'

export default function PaginaRaiz() {
  redirect('/login')
}

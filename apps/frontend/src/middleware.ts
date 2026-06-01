import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const SUPABASE_TIMEOUT_MS = 3000

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // Si Supabase no responde en tiempo, tratamos al usuario como no autenticado
  // para evitar que el middleware cuelgue y deje al usuario en limbo
  const fallback = new Promise<{ data: { user: null }; error: null }>((resolve) =>
    setTimeout(() => resolve({ data: { user: null }, error: null }), SUPABASE_TIMEOUT_MS),
  )

  const { data: { user } } = await Promise.race([supabase.auth.getUser(), fallback])
  const { pathname } = request.nextUrl

  if (!user && !pathname.startsWith('/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && pathname.startsWith('/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/perfil'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}

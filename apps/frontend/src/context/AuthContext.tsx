'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { getSupabaseClient } from '@/src/lib/supabase'
import { api } from '@/servicios/api'
import type { Usuario } from '@/tipos'

type AuthContextType = {
  token: string | null
  yo: Usuario | null
  cargando: boolean
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  yo: null,
  cargando: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [yo, setYo] = useState<Usuario | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const supabase = getSupabaseClient()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const t = session?.access_token ?? null
      setToken(t)
      if (t) {
        try {
          const usuario = await api.get<Usuario>('/auth/me', t)
          setYo(usuario)
        } catch {
          setYo(null)
        }
      } else {
        setYo(null)
      }
      setCargando(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    // Cuando cualquier llamada al backend devuelve 401, el token expiró.
    // Redirigimos a la ruta de signout que limpia la sesión de Supabase y lleva al login.
    function manejarSesionExpirada() {
      window.location.href = '/api/auth/signout'
    }
    window.addEventListener('auth:session-expired', manejarSesionExpirada)
    return () => window.removeEventListener('auth:session-expired', manejarSesionExpirada)
  }, [])

  return (
    <AuthContext.Provider value={{ token, yo, cargando }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

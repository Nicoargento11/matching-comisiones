'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from './AuthContext'
import { api } from '@/servicios/api'
import { getSupabaseClient } from '@/src/lib/supabase'
import type { Conversacion, RespuestaPaginada } from '@/tipos'
import { tieneNoLeidos } from '@/lib/mensajeria'

type MensajesNoLeidosContextType = {
  mensajesNoLeidos: number
}

const MensajesNoLeidosContext = createContext<MensajesNoLeidosContextType>({
  mensajesNoLeidos: 0,
})

export function MensajesNoLeidosProvider({ children }: { children: React.ReactNode }) {
  const { yo, token } = useAuth()
  const pathname = usePathname()
  const [contador, setContador] = useState(0)

  // refs para leer valores frescos dentro del callback de Supabase
  const yoRef = useRef(yo)
  yoRef.current = yo
  const pathnameRef = useRef(pathname)
  pathnameRef.current = pathname
  // IDs de conversaciones en las que participa el usuario — para filtrar mensajes ajenos
  const convIdsRef = useRef(new Set<number>())

  // reset al entrar a la vista de mensajes
  useEffect(() => {
    if (pathname === '/mensajes') setContador(0)
  }, [pathname])

  // carga inicial: contador de conversaciones con mensajes no leídos
  useEffect(() => {
    if (!yo || !token) { setContador(0); return }
    let vivo = true
    api.get<RespuestaPaginada<Conversacion>>('/conversaciones/mis-conversaciones', token)
      .then((res) => {
        if (!vivo) return
        const convs = res.data ?? []
        convIdsRef.current = new Set(convs.map((c) => c.id_conversacion))
        setContador(convs.filter((c) => tieneNoLeidos(c, yo.id_usuario)).length)
      })
      .catch(() => { if (vivo) setContador(0) })
    return () => { vivo = false }
  }, [yo?.id_usuario, token])

  // suscripción Supabase: incrementa al llegar un mensaje nuevo que no es mío
  useEffect(() => {
    if (!yo) return
    const supabase = getSupabaseClient()
    const channel = supabase
      .channel('navbar-mensajes-noLeidos')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'mensaje' },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          const row = payload.new as {
            id_mensaje: number
            id_conversacion: number
            id_usuario_emisor: number
          }
          if (row.id_usuario_emisor === yoRef.current?.id_usuario) return
          if (!convIdsRef.current.has(row.id_conversacion)) return
          if (pathnameRef.current === '/mensajes') return
          setContador((prev) => prev + 1)
        },
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [yo?.id_usuario])

  return (
    <MensajesNoLeidosContext.Provider value={{ mensajesNoLeidos: contador }}>
      {children}
    </MensajesNoLeidosContext.Provider>
  )
}

export function useMensajesNoLeidos() {
  return useContext(MensajesNoLeidosContext)
}

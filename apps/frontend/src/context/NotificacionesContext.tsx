'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import { notificacionServicio } from '@/servicios/notificacionServicio'
import type { Notificacion } from '@/tipos'

type NotificacionesContextType = {
  notificaciones: Notificacion[]
  noLeidas: number
  cargando: boolean
  marcarLeida: (idNotificacion: number) => void
  marcarTodasLeidas: () => void
}

const NotificacionesContext = createContext<NotificacionesContextType>({
  notificaciones: [],
  noLeidas: 0,
  cargando: false,
  marcarLeida: () => {},
  marcarTodasLeidas: () => {},
})

export function NotificacionesProvider({ children }: { children: React.ReactNode }) {
  const { yo, token } = useAuth()
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (!yo) {
      setNotificaciones([])
      setCargando(false)
      return
    }

    notificacionServicio.obtenerPorUsuario(yo.id_usuario, token ?? undefined)
      .then(setNotificaciones)
      .catch(() => setNotificaciones([]))
      .finally(() => setCargando(false))
  }, [yo, token])

  const noLeidas = notificaciones.filter((n) => !n.leida).length

  const marcarLeida = useCallback((idNotificacion: number) => {
    setNotificaciones((prev) =>
      prev.map((n) => (n.id_notificacion === idNotificacion ? { ...n, leida: true } : n)),
    )
    notificacionServicio.marcarLeida(idNotificacion, token ?? undefined)
  }, [token])

  const marcarTodasLeidas = useCallback(() => {
    if (!yo) return
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })))
    notificacionServicio.marcarTodasLeidas(yo.id_usuario, token ?? undefined)
  }, [yo, token])

  return (
    <NotificacionesContext.Provider value={{ notificaciones, noLeidas, cargando, marcarLeida, marcarTodasLeidas }}>
      {children}
    </NotificacionesContext.Provider>
  )
}

export function useNotificaciones() {
  return useContext(NotificacionesContext)
}

'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import type { Notificacion } from '@/tipos'

// TODO: eliminar mock y descomentar la llamada real cuando el backend implemente el endpoint
// import { notificacionServicio } from '@/servicios/notificacionServicio'
const NOTIFICACIONES_MOCK: Notificacion[] = [
  {
    id_notificacion: 1,
    tipo: 'MATCHING_COMISION',
    titulo: 'Fuiste asignado a una comisión',
    mensaje: 'El sistema te asignó a la Comisión 3 de Algoritmos y Estructuras de Datos.',
    leida: false,
    creada_en: new Date(Date.now() - 1_000 * 60 * 25).toISOString(),
    datos: { id_comision: 3, nombre_comision: 'Comisión 3', nombre_materia: 'Algoritmos y Estructuras de Datos' },
  },
  {
    id_notificacion: 2,
    tipo: 'MATCHING_COMISION',
    titulo: 'Fuiste asignado a una comisión',
    mensaje: 'El sistema te asignó a la Comisión 1 de Análisis Matemático I.',
    leida: false,
    creada_en: new Date(Date.now() - 1_000 * 60 * 60 * 2).toISOString(),
    datos: { id_comision: 1, nombre_comision: 'Comisión 1', nombre_materia: 'Análisis Matemático I' },
  },
  {
    id_notificacion: 3,
    tipo: 'SISTEMA',
    titulo: 'Bienvenido al SIC',
    mensaje: 'Tu cuenta fue activada correctamente. Ya podés ver tus materias asignadas.',
    leida: true,
    creada_en: new Date(Date.now() - 1_000 * 60 * 60 * 24 * 2).toISOString(),
  },
]

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
  const { yo } = useAuth()
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (!yo) {
      setNotificaciones([])
      setCargando(false)
      return
    }

    // TODO: reemplazar por llamada real cuando el backend esté listo:
    // notificacionServicio.obtenerPorUsuario(yo.id_usuario, token ?? undefined)
    //   .then(setNotificaciones)
    //   .catch(() => setNotificaciones([]))
    //   .finally(() => setCargando(false))
    setNotificaciones(NOTIFICACIONES_MOCK)
    setCargando(false)
  }, [yo])

  const noLeidas = notificaciones.filter((n) => !n.leida).length

  const marcarLeida = useCallback((idNotificacion: number) => {
    setNotificaciones((prev) =>
      prev.map((n) => (n.id_notificacion === idNotificacion ? { ...n, leida: true } : n)),
    )
    // TODO: notificacionServicio.marcarLeida(idNotificacion, token ?? undefined)
  }, [])

  const marcarTodasLeidas = useCallback(() => {
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })))
    // TODO: notificacionServicio.marcarTodasLeidas(yo?.id_usuario, token ?? undefined)
  }, [])

  return (
    <NotificacionesContext.Provider value={{ notificaciones, noLeidas, cargando, marcarLeida, marcarTodasLeidas }}>
      {children}
    </NotificacionesContext.Provider>
  )
}

export function useNotificaciones() {
  return useContext(NotificacionesContext)
}

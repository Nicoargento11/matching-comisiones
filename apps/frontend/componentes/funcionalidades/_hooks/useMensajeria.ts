import { useState, useEffect, useRef, useCallback } from 'react'
import type { KeyboardEvent } from 'react'
import { getSupabaseClient } from '@/src/lib/supabase'
import { api } from '@/servicios/api'
import { ApiError } from '@/servicios/api'
import { mensajeServicio } from '@/servicios/mensajeServicio'
import { usuarioServicio } from '@/servicios/usuarioServicio'
import type { Comision, Conversacion, MensajeAPI, Usuario } from '@/tipos'
import { obtenerRol } from '@/lib/roles'

export interface ToastMensaje {
  id: number
  nombre: string
  apellido: string
  idUsuario: number
  contenido: string
  convId: number
}

function tieneNoLeidos(conv: Conversacion, yoId: number): boolean {
  const ultimo = conv.mensajes[0]
  if (!ultimo) return false
  if (ultimo.id_usuario_emisor === yoId) return false
  const miPart = conv.participantes.find((p) => p.usuario.id_usuario === yoId)
  if (!miPart?.ultimo_leido) return true
  return new Date(ultimo.creado_en) > new Date(miPart.ultimo_leido)
}

export function useMensajeria(convId: number | null, token: string | null, yo: Usuario | null) {
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([])
  const [comisiones, setComisiones] = useState<Comision[]>([])
  const [mensajes, setMensajes] = useState<MensajeAPI[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [nuevoMensaje, setNuevoMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [toasts, setToasts] = useState<ToastMensaje[]>([])
  const mensajesRef = useRef<HTMLDivElement>(null)
  const toastContRef = useRef(0)

  // refs para leer datos frescos dentro de callbacks de Supabase
  // sin que los efectos de suscripción necesiten re-ejecutarse
  const conversacionesRef = useRef(conversaciones)
  conversacionesRef.current = conversaciones
  const convIdRef = useRef(convId)
  convIdRef.current = convId

  // carga inicial: conversaciones y comisiones del usuario en paralelo
  useEffect(() => {
    if (!token || !yo) return
    let vivo = true
    Promise.all([
      api.get<Conversacion[]>('/conversaciones/mis-conversaciones', token),
      usuarioServicio.obtenerComisiones(yo.id_usuario, token),
    ])
      .then(([convs, coms]) => {
        if (!vivo) return
        setConversaciones(Array.isArray(convs) ? convs : [])
        setComisiones(Array.isArray(coms) ? coms : [])
      })
      .catch(() => {
        if (!vivo) return
        setConversaciones([])
        setComisiones([])
      })
    return () => { vivo = false }
  }, [token, yo?.id_usuario])

  useEffect(() => {
    if (!convId || !token) { setMensajes([]); return }
    let vivo = true
    api.get<MensajeAPI[]>(`/mensajes/${convId}`, token)
      .then((data) => { if (vivo) setMensajes(data) })
      .catch(() => { if (vivo) setMensajes([]) })
    return () => { vivo = false }
  }, [convId, token])

  useEffect(() => {
    if (!convId || !yo || !token) return
    let vivo = true
    api
      .patch(`/conversaciones/${convId}/leido`, { id_usuario: yo.id_usuario }, token)
      .then(() => {
        if (!vivo) return
        setConversaciones((prev) =>
          prev.map((c) =>
            c.id_conversacion !== convId
              ? c
              : {
                  ...c,
                  participantes: c.participantes.map((p) =>
                    p.usuario.id_usuario === yo.id_usuario
                      ? { ...p, ultimo_leido: new Date().toISOString() }
                      : p,
                  ),
                },
          ),
        )
      })
      .catch(() => {})
    return () => { vivo = false }
  }, [convId, yo, token])

  useEffect(() => {
    if (!convId || !yo) return
    const supabase = getSupabaseClient()
    const channel = supabase
      .channel(`conv-${convId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'mensaje' },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          const row = payload.new as {
            id_mensaje: number
            contenido: string
            creado_en: string
            id_conversacion: number
            id_usuario_emisor: number
          }
          if (row.id_conversacion !== convId || row.id_usuario_emisor === yo.id_usuario) return
          const emisorData = conversacionesRef.current
            .find((c) => c.id_conversacion === convId)
            ?.participantes.find((p) => p.usuario.id_usuario === row.id_usuario_emisor)
            ?.usuario
          if (!emisorData) return
          setMensajes((prev) =>
            prev.some((m) => m.id_mensaje === row.id_mensaje)
              ? prev
              : [...prev, { id_mensaje: row.id_mensaje, contenido: row.contenido, creado_en: row.creado_en, emisor: emisorData }],
          )
        },
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [convId, yo])

  useEffect(() => {
    if (!yo) return
    const supabase = getSupabaseClient()
    const channel = supabase
      .channel('all-convs-notify')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'mensaje' },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          const row = payload.new as {
            id_mensaje: number
            contenido: string
            creado_en: string
            id_conversacion: number
            id_usuario_emisor: number
          }
          if (row.id_conversacion === convIdRef.current) return
          if (row.id_usuario_emisor === yo.id_usuario) return
          const conv = conversacionesRef.current.find((c) => c.id_conversacion === row.id_conversacion)
          if (!conv) return
          const emisor = conv.participantes.find(
            (p) => p.usuario.id_usuario === row.id_usuario_emisor,
          )?.usuario
          if (!emisor) return
          setConversaciones((prev) =>
            prev.map((c) =>
              c.id_conversacion !== row.id_conversacion
                ? c
                : { ...c, mensajes: [{ contenido: row.contenido, creado_en: row.creado_en, id_usuario_emisor: row.id_usuario_emisor }] },
            ),
          )
          const toastId = ++toastContRef.current
          setToasts((prev) => [
            ...prev,
            { id: toastId, nombre: emisor.nombre_usuario, apellido: emisor.apellido_usuario, idUsuario: emisor.id_usuario, contenido: row.contenido, convId: row.id_conversacion },
          ])
          setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== toastId))
          }, 5000)
        },
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [yo])

  useEffect(() => {
    if (mensajesRef.current)
      mensajesRef.current.scrollTop = mensajesRef.current.scrollHeight
  }, [mensajes.length, convId])

  // Inicia o navega a una conversación existente con otro usuario.
  // Devuelve el id_conversacion si tuvo éxito, null si falló.
  const iniciarConversacion = useCallback(async (idUsuarioDestino: number): Promise<number | null> => {
    if (!yo || !token) return null
    try {
      const nueva = await mensajeServicio.crearConversacion(yo.id_usuario, idUsuarioDestino, token)
      setConversaciones((prev) => [{ ...nueva, mensajes: nueva.mensajes ?? [] }, ...prev])
      return nueva.id_conversacion
    } catch (e) {
      // 409 = la conversación ya existe — navegamos a la existente
      if (e instanceof ApiError && e.status === 409) {
        const existente = conversaciones.find((c) =>
          c.participantes.some((p) => p.usuario.id_usuario === idUsuarioDestino),
        )
        return existente?.id_conversacion ?? null
      }
      return null
    }
  }, [yo, token, conversaciones])

  function otroParticipante(conv: Conversacion) {
    return conv.participantes.find((p) => p.usuario.id_usuario !== yo?.id_usuario)?.usuario ?? null
  }

  const convActiva = conversaciones.find((c) => c.id_conversacion === convId) ?? null
  const contactoActivo = convActiva ? otroParticipante(convActiva) : null
  const rolContactoActivo = contactoActivo ? obtenerRol(contactoActivo.roles) : null

  const convsFiltradas = conversaciones
    .filter((c) => {
      const otro = otroParticipante(c)
      return otro && `${otro.nombre_usuario} ${otro.apellido_usuario}`.toLowerCase().includes(busqueda.toLowerCase())
    })
    .sort((a, b) => {
      const aUnread = yo ? tieneNoLeidos(a, yo.id_usuario) : false
      const bUnread = yo ? tieneNoLeidos(b, yo.id_usuario) : false
      if (aUnread === bUnread) return 0
      return aUnread ? -1 : 1
    })

  const fechasUnicas = [...new Set(mensajes.map((m) => new Date(m.creado_en).toDateString()))]

  async function enviarMensaje(e?: React.FormEvent) {
    e?.preventDefault()
    if (!nuevoMensaje.trim() || !convId || !yo || !token || enviando) return
    const contenido = nuevoMensaje.trim()
    setNuevoMensaje('')
    setEnviando(true)
    try {
      const nuevo = await api.post<{ id_mensaje: number; contenido: string; creado_en: string }>(
        '/mensajes',
        { contenido, id_conversacion: convId, id_usuario_emisor: yo.id_usuario },
        token,
      )
      setMensajes((prev) =>
        prev.some((m) => m.id_mensaje === nuevo.id_mensaje)
          ? prev
          : [...prev, { ...nuevo, emisor: { id_usuario: yo.id_usuario, nombre_usuario: yo.nombre_usuario, apellido_usuario: yo.apellido_usuario } }],
      )
      setConversaciones((prev) =>
        prev.map((c) =>
          c.id_conversacion !== convId
            ? c
            : { ...c, mensajes: [{ contenido, creado_en: nuevo.creado_en, id_usuario_emisor: yo.id_usuario }] },
        ),
      )
    } catch {
      setNuevoMensaje(contenido)
    } finally {
      setEnviando(false)
    }
  }

  function manejarTecla(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      enviarMensaje()
    }
  }

  return {
    conversaciones,
    comisiones,
    mensajes,
    busqueda,
    setBusqueda,
    nuevoMensaje,
    setNuevoMensaje,
    enviando,
    toasts,
    setToasts,
    mensajesRef,
    convActiva,
    contactoActivo,
    rolContactoActivo,
    convsFiltradas,
    fechasUnicas,
    otroParticipante,
    enviarMensaje,
    manejarTecla,
    iniciarConversacion,
  }
}

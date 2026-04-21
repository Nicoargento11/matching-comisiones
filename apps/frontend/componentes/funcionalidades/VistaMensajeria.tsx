'use client'

// vista de mensajeria 1 a 1 entre usuarios del sistema
// funciona tanto para alumnos como para profesores
import { useState, useEffect, useRef, KeyboardEvent } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  todosLosUsuarios,
  conversacionesMockInicial,
  claveConversacion,
  buscarUsuarioPorId,
} from '@/lib/datosMock'
import { Mensaje, UsuarioMensajeria } from '@/tipos'

// ─────────────────────────────────────────────
//  UTILIDADES
// ─────────────────────────────────────────────

function formatearHora(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatearFechaCorta(timestamp: string): string {
  const fecha = new Date(timestamp)
  const hoy = new Date()
  const ayer = new Date(hoy)
  ayer.setDate(hoy.getDate() - 1)

  if (fecha.toDateString() === hoy.toDateString()) return 'Hoy'
  if (fecha.toDateString() === ayer.toDateString()) return 'Ayer'
  return fecha.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })
}

function ultimoMensaje(
  mensajes: Mensaje[],
  yoId: number
): { texto: string; esMio: boolean } | null {
  if (mensajes.length === 0) return null
  const ultimo = mensajes[mensajes.length - 1]
  return {
    texto: ultimo.contenido,
    esMio: ultimo.id_usuario_emisor === yoId,
  }
}

// ─────────────────────────────────────────────
//  SUB-COMPONENTES
// ─────────────────────────────────────────────

const PALETA_AVATAR = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6', '#f97316', '#ec4899']

function AvatarUsuario({
  usuario,
  size = 'md',
}: {
  usuario: UsuarioMensajeria
  size?: 'sm' | 'md' | 'lg'
}) {
  const color = PALETA_AVATAR[usuario.id_usuario % PALETA_AVATAR.length]
  const clases = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
  }[size]

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${clases}`}
      style={{ backgroundColor: color }}
    >
      {usuario.nombre_usuario[0]}{usuario.apellido_usuario[0]}
    </div>
  )
}

function InsigniaRol({ rol }: { rol: 'estudiante' | 'profesor' }) {
  return (
    <span
      className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
        rol === 'profesor'
          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
      }`}
    >
      {rol === 'profesor' ? 'Profesor' : 'Alumno'}
    </span>
  )
}

// ─────────────────────────────────────────────
//  COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────

export default function VistaMensajeria() {
  const searchParams = useSearchParams()
  const router = useRouter()

  // id del usuario logueado (viene por URL como numero)
  const yoId = Number(searchParams.get('yo') ?? '1')
  // id del contacto con quien esta chateando (opcional)
  const conIdParam = searchParams.get('con')
  const conId: number | null = conIdParam ? Number(conIdParam) : null

  const yoUsuario = buscarUsuarioPorId(yoId)
  const contactos = todosLosUsuarios.filter((u) => u.id_usuario !== yoId)

  const [busqueda, setBusqueda] = useState('')
  const [conversaciones, setConversaciones] = useState<Record<string, Mensaje[]>>(
    conversacionesMockInicial
  )
  const [nuevoMensaje, setNuevoMensaje] = useState('')

  const mensajesRef = useRef<HTMLDivElement>(null)

  const contactoActivo = conId !== null ? buscarUsuarioPorId(conId) : null
  const claveConv = conId !== null ? claveConversacion(yoId, conId) : null
  const mensajesActivos = claveConv ? (conversaciones[claveConv] ?? []) : []

  const contactosFiltrados = contactos.filter((c) =>
    `${c.nombre_usuario} ${c.apellido_usuario}`.toLowerCase().includes(busqueda.toLowerCase())
  )

  useEffect(() => {
    if (mensajesRef.current) {
      mensajesRef.current.scrollTop = mensajesRef.current.scrollHeight
    }
  }, [mensajesActivos.length, conId])

  function seleccionarContacto(id: number) {
    router.push(`/mensajes?yo=${yoId}&con=${id}`)
  }

  function volverALista() {
    router.push(`/mensajes?yo=${yoId}`)
  }

  function enviarMensaje(e?: React.FormEvent) {
    e?.preventDefault()
    if (!nuevoMensaje.trim() || !claveConv) return

    const msg: Mensaje = {
      id_mensaje: Date.now(),
      id_usuario_emisor: yoId,
      contenido: nuevoMensaje.trim(),
      creado_en: new Date().toISOString(),
    }

    setConversaciones((prev) => ({
      ...prev,
      [claveConv]: [...(prev[claveConv] ?? []), msg],
    }))
    setNuevoMensaje('')
  }

  function manejarTecla(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      enviarMensaje()
    }
  }

  function obtenerFechasMensajes(): string[] {
    const fechas = mensajesActivos.map((m) =>
      new Date(m.creado_en).toDateString()
    )
    return [...new Set(fechas)]
  }

  // render ──────────────────────────────────────────────────────────

  return (
    <div className="flex h-[calc(100vh-8rem)] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">

      {/* ─── PANEL IZQUIERDO: lista de contactos ─── */}
      <div
        className={`flex w-full flex-col border-r border-gray-200 dark:border-gray-700 sm:w-80 sm:shrink-0 ${
          conId !== null ? 'hidden sm:flex' : 'flex'
        }`}
      >
        <div className="border-b border-gray-200 px-4 py-4 dark:border-gray-700">
          <h2 className="mb-3 text-base font-semibold text-gray-900 dark:text-gray-100">
            Mensajes
          </h2>
          <div className="relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            >
              <path
                fillRule="evenodd"
                d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
                clipRule="evenodd"
              />
            </svg>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre..."
              className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {contactosFiltrados.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
              No se encontraron usuarios
            </p>
          ) : (
            contactosFiltrados.map((contacto) => {
              const clave = claveConversacion(yoId, contacto.id_usuario)
              const ultimo = ultimoMensaje(conversaciones[clave] ?? [], yoId)
              const esActivo = conId === contacto.id_usuario

              return (
                <button
                  key={contacto.id_usuario}
                  onClick={() => seleccionarContacto(contacto.id_usuario)}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    esActivo ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                  }`}
                >
                  <AvatarUsuario usuario={contacto} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                        {contacto.nombre_usuario} {contacto.apellido_usuario}
                      </span>
                      <InsigniaRol rol={contacto.rol} />
                    </div>
                    {ultimo && (
                      <p className="truncate text-xs text-gray-400 dark:text-gray-500">
                        {ultimo.esMio ? 'Vos: ' : ''}{ultimo.texto}
                      </p>
                    )}
                  </div>
                </button>
              )
            })
          )}
        </div>

        {yoUsuario && (
          <div className="flex items-center gap-2 border-t border-gray-100 px-4 py-3 dark:border-gray-700">
            <AvatarUsuario usuario={yoUsuario} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-gray-700 dark:text-gray-300">
                {yoUsuario.nombre_usuario} {yoUsuario.apellido_usuario}
              </p>
              <InsigniaRol rol={yoUsuario.rol} />
            </div>
          </div>
        )}
      </div>

      {/* ─── PANEL DERECHO: chat ─── */}
      <div
        className={`flex flex-1 flex-col ${
          conId !== null ? 'flex' : 'hidden sm:flex'
        }`}
      >
        {contactoActivo ? (
          <>
            <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
              <button
                onClick={volverALista}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 sm:hidden"
                aria-label="Volver a la lista"
              >
                ←
              </button>
              <AvatarUsuario usuario={contactoActivo} size="md" />
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {contactoActivo.nombre_usuario} {contactoActivo.apellido_usuario}
                </h3>
                <InsigniaRol rol={contactoActivo.rol} />
              </div>
            </div>

            <div
              ref={mensajesRef}
              className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-4"
            >
              {mensajesActivos.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-2">
                  <AvatarUsuario usuario={contactoActivo} size="lg" />
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {contactoActivo.nombre_usuario} {contactoActivo.apellido_usuario}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    No hay mensajes aun. Empieza la conversacion!
                  </p>
                </div>
              ) : (
                (() => {
                  const fechas = obtenerFechasMensajes()
                  return fechas.map((fechaStr) => {
                    const mensajesDia = mensajesActivos.filter(
                      (m) => new Date(m.creado_en).toDateString() === fechaStr
                    )
                    const primerMsg = mensajesDia[0]
                    return (
                      <div key={fechaStr} className="flex flex-col gap-1">
                        <div className="my-3 flex items-center gap-3">
                          <div className="flex-1 border-t border-gray-100 dark:border-gray-700" />
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {formatearFechaCorta(primerMsg.creado_en)}
                          </span>
                          <div className="flex-1 border-t border-gray-100 dark:border-gray-700" />
                        </div>

                        {mensajesDia.map((mensaje) => {
                          const esMio = mensaje.id_usuario_emisor === yoId
                          return (
                            <div
                              key={mensaje.id_mensaje}
                              className={`flex ${esMio ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`group flex max-w-[75%] flex-col gap-0.5 ${
                                  esMio ? 'items-end' : 'items-start'
                                }`}
                              >
                                <div
                                  className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                                    esMio
                                      ? 'rounded-br-sm bg-indigo-600 text-white'
                                      : 'rounded-bl-sm bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100'
                                  }`}
                                >
                                  {mensaje.contenido}
                                </div>
                                <span className="text-[10px] text-gray-400 opacity-0 transition-opacity group-hover:opacity-100 dark:text-gray-500">
                                  {formatearHora(mensaje.creado_en)}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })
                })()
              )}
            </div>

            <form
              onSubmit={enviarMensaje}
              className="flex items-end gap-2 border-t border-gray-200 px-4 py-3 dark:border-gray-700"
            >
              <textarea
                value={nuevoMensaje}
                onChange={(e) => setNuevoMensaje(e.target.value)}
                onKeyDown={manejarTecla}
                placeholder="Escribe un mensaje... (Enter para enviar)"
                rows={1}
                className="flex-1 resize-none rounded-xl border border-gray-300 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
                style={{ maxHeight: '120px' }}
                onInput={(e) => {
                  const t = e.currentTarget
                  t.style.height = 'auto'
                  t.style.height = `${t.scrollHeight}px`
                }}
              />
              <button
                type="submit"
                disabled={!nuevoMensaje.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm transition-all hover:bg-indigo-500 disabled:opacity-40"
                aria-label="Enviar mensaje"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4 translate-x-0.5"
                >
                  <path d="M3.105 2.288a.75.75 0 0 0-.826.95l1.414 4.926A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95 28.897 28.897 0 0 0 15.293-7.155.75.75 0 0 0 0-1.114A28.897 28.897 0 0 0 3.105 2.288Z" />
                </svg>
              </button>
            </form>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-8 w-8 text-gray-300 dark:text-gray-600"
              >
                <path
                  fillRule="evenodd"
                  d="M4.848 2.771A49.144 49.144 0 0 1 12 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 0 1-3.476.383.39.39 0 0 0-.297.17l-2.755 4.133a.75.75 0 0 1-1.248 0l-2.755-4.133a.39.39 0 0 0-.297-.17 48.9 48.9 0 0 1-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97Z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Selecciona una conversacion
              </p>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                Busca un alumno o profesor en el panel izquierdo
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

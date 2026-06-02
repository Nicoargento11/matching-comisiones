'use client'

import { useState, useEffect, useRef } from 'react'
import { ApiError } from '@/servicios/api'
import { usuarioServicio } from '@/servicios/usuarioServicio'
import type { Comision, UsuarioBusquedaPorDni } from '@/tipos'
import Avatar from '@/componentes/interfaz/Avatar'
import RolBadge from '@/componentes/interfaz/RolBadge'
import { obtenerRol } from '@/lib/roles'

interface Props {
  token: string
  comisiones: Comision[]
  onConversacionIniciada: (idUsuario: number) => Promise<void>
  onCancelar: () => void
}

type EstadoBusqueda = 'idle' | 'cargando' | 'ok' | 'vacio' | 'error' | 'pendiente-backend'

function esDni(valor: string): boolean {
  return /^\d+$/.test(valor.trim())
}

export default function BuscadorNuevaConversacion({ token, comisiones, onConversacionIniciada, onCancelar }: Props) {
  const [query, setQuery] = useState('')
  const [comisionFiltro, setComisionFiltro] = useState<number | null>(null)
  const [resultados, setResultados] = useState<UsuarioBusquedaPorDni[]>([])
  const [estado, setEstado] = useState<EstadoBusqueda>('idle')
  const [seleccionando, setSeleccionando] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  // debounce + lógica de búsqueda
  useEffect(() => {
    const valor = query.trim()

    if (!valor) {
      setResultados([])
      setEstado('idle')
      return
    }

    const delay = setTimeout(async () => {
      setEstado('cargando')
      setResultados([])

      try {
        if (esDni(valor) && valor.length >= 7) {
          const usuario = await usuarioServicio.obtenerPorDni(Number(valor), token)
          setResultados([usuario])
          setEstado('ok')
        } else if (!esDni(valor) && valor.length >= 3) {
          const lista = await usuarioServicio.buscarParaMensajeria(valor, comisionFiltro ?? undefined, token)
          if (lista.length === 0) {
            setEstado('vacio')
          } else {
            setResultados(lista)
            setEstado('ok')
          }
        } else {
          setEstado('idle')
        }
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) {
          if (esDni(valor)) {
            setEstado('vacio')
          } else {
            // el endpoint de búsqueda por nombre todavía no existe en el backend
            setEstado('pendiente-backend')
          }
        } else {
          setEstado('error')
        }
      }
    }, 300)

    return () => clearTimeout(delay)
  }, [query, comisionFiltro, token])

  async function seleccionarUsuario(usuario: UsuarioBusquedaPorDni) {
    if (seleccionando !== null) return
    setSeleccionando(usuario.id_usuario)
    try {
      await onConversacionIniciada(usuario.id_usuario)
    } finally {
      setSeleccionando(null)
    }
  }

  const valorMostrado = query.trim()
  const esBusquedaDni = esDni(valorMostrado)
  const esperandoMasChars = !esBusquedaDni && valorMostrado.length > 0 && valorMostrado.length < 3

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* header */}
      <div className="border-b border-gray-200 px-4 py-4 dark:border-gray-700">
        <div className="mb-3 flex items-center gap-2">
          <button
            onClick={onCancelar}
            aria-label="Volver"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
              <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
            </svg>
          </button>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Nueva conversación</h2>
        </div>

        {/* input de búsqueda */}
        <div className="relative">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden>
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nombre o DNI..."
            className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
          />
          {estado === 'cargando' && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-500 inline-block" />
            </span>
          )}
        </div>

        {/* filtro por comisión */}
        {comisiones.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <button
              onClick={() => setComisionFiltro(null)}
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                comisionFiltro === null
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
              }`}
            >
              Todas
            </button>
            {comisiones.map((c) => (
              <button
                key={c.id_comision}
                onClick={() => setComisionFiltro(comisionFiltro === c.id_comision ? null : c.id_comision)}
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                  comisionFiltro === c.id_comision
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
                }`}
              >
                {c.materia.nombre_materia}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* resultados */}
      <div className="flex-1 overflow-y-auto">
        {estado === 'idle' && (
          <p className="px-4 py-6 text-center text-xs text-gray-400 dark:text-gray-500">
            {esBusquedaDni
              ? 'Ingresá al menos 7 dígitos para buscar por DNI'
              : 'Escribí un nombre (mínimo 3 letras) o un DNI'}
          </p>
        )}

        {esperandoMasChars && (
          <p className="px-4 py-6 text-center text-xs text-gray-400 dark:text-gray-500">
            Seguí escribiendo...
          </p>
        )}

        {estado === 'vacio' && (
          <p className="px-4 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
            No se encontró ningún usuario
          </p>
        )}

        {estado === 'pendiente-backend' && (
          <div className="px-4 py-6 text-center">
            <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Búsqueda por nombre no disponible aún</p>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              Podés buscar por DNI mientras tanto
            </p>
          </div>
        )}

        {estado === 'error' && (
          <p className="px-4 py-8 text-center text-sm text-red-500 dark:text-red-400">
            Error al buscar. Intentá de nuevo.
          </p>
        )}

        {estado === 'ok' && resultados.map((usuario) => {
          const rol = obtenerRol(usuario.roles)
          const procesando = seleccionando === usuario.id_usuario
          return (
            <button
              key={usuario.id_usuario}
              onClick={() => seleccionarUsuario(usuario)}
              disabled={seleccionando !== null}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 disabled:cursor-wait dark:hover:bg-gray-800/60"
            >
              <Avatar
                id={usuario.id_usuario}
                nombre={usuario.nombre_usuario}
                apellido={usuario.apellido_usuario}
                size="md"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">
                    {usuario.nombre_usuario} {usuario.apellido_usuario}
                  </span>
                  {rol && <RolBadge rol={rol} />}
                </div>
                <p className="truncate text-xs text-gray-400 dark:text-gray-500">{usuario.correo}</p>
              </div>
              {procesando ? (
                <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-500" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-gray-300 dark:text-gray-600" aria-hidden>
                  <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

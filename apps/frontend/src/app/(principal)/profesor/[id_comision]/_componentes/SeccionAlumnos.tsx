'use client'

import { useState } from 'react'
import { api } from '@/servicios/api'
import { comisionServicio } from '@/servicios/comisionServicio'
import { usuarioServicio } from '@/servicios/usuarioServicio'
import BannerExito from '@/componentes/interfaz/BannerExito'
import type { Comision, ComisionConflicto, EstadoInscripcion, ItemComisionConEstado, UsuarioBusquedaPorDni, UsuarioInComision } from '@/tipos'

type Props = {
  alumnosIniciales: UsuarioInComision[]
  alumnosBajaIniciales: UsuarioInComision[]
  comision: Comision
  token: string | null
  onAlumnosChange: (activos: UsuarioInComision[], bajas: UsuarioInComision[]) => void
}

export default function SeccionAlumnos({ alumnosIniciales, alumnosBajaIniciales, comision, token, onAlumnosChange }: Props) {
  const [alumnos, setAlumnos] = useState<UsuarioInComision[]>(alumnosIniciales)
  const [alumnosDadosDeBaja, setAlumnosDadosDeBaja] = useState<UsuarioInComision[]>(alumnosBajaIniciales)
  const [alumnoAConfirmarBaja, setAlumnoAConfirmarBaja] = useState<UsuarioInComision | null>(null)
  const [busquedaAlumnos, setBusquedaAlumnos] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [idBusqueda, setIdBusqueda] = useState('')
  const [alumnoEncontrado, setAlumnoEncontrado] = useState<UsuarioInComision | null>(null)
  const [errorAlumno, setErrorAlumno] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [procesando, setProcesando] = useState(false)
  const [comisionesConflicto, setComisionesConflicto] = useState<ComisionConflicto[]>([])
  const [confirmarAgregarConConflicto, setConfirmarAgregarConConflicto] = useState(false)

  function mostrarExito(msg: string) {
    setMensaje(msg)
    setTimeout(() => setMensaje(''), 4000)
  }

  function actualizarListas(activos: UsuarioInComision[], bajas: UsuarioInComision[]) {
    setAlumnos(activos)
    setAlumnosDadosDeBaja(bajas)
    onAlumnosChange(activos, bajas)
  }

  function solicitarBajaAlumno(idUsuario: number) {
    const alumno = alumnos.find((a) => a.usuario.id_usuario === idUsuario)
    if (!alumno) return
    setAlumnoAConfirmarBaja(alumno)
  }

  async function confirmarBajaAlumno() {
    if (!alumnoAConfirmarBaja || procesando) return
    const alumno = alumnoAConfirmarBaja
    setAlumnoAConfirmarBaja(null)
    setProcesando(true)
    try {
      await comisionServicio.darBajaEstudiante(comision.id_comision, alumno.usuario.id_usuario, token ?? undefined)
      actualizarListas(
        alumnos.filter((a) => a.usuario.id_usuario !== alumno.usuario.id_usuario),
        [...alumnosDadosDeBaja, alumno],
      )
      mostrarExito(`${alumno.usuario.nombre_usuario} ${alumno.usuario.apellido_usuario} fue dado de baja`)
    } catch (e) {
      mostrarExito(`Error al dar de baja: ${e instanceof Error ? e.message : 'intentá de nuevo'}`)
    } finally {
      setProcesando(false)
    }
  }

  async function reincorporarAlumno(idUsuario: number) {
    if (procesando) return
    const alumno = alumnosDadosDeBaja.find((a) => a.usuario.id_usuario === idUsuario)
    if (!alumno) return
    setProcesando(true)
    try {
      await comisionServicio.agregarEstudiante(comision.id_comision, idUsuario, token ?? undefined)
      actualizarListas(
        [...alumnos, alumno],
        alumnosDadosDeBaja.filter((a) => a.usuario.id_usuario !== idUsuario),
      )
      mostrarExito(`${alumno.usuario.nombre_usuario} ${alumno.usuario.apellido_usuario} fue reincorporado`)
    } catch (e) {
      mostrarExito(`Error al reincorporar: ${e instanceof Error ? e.message : 'intentá de nuevo'}`)
    } finally {
      setProcesando(false)
    }
  }

  async function buscarAlumno(e: React.FormEvent) {
    e.preventDefault()
    setErrorAlumno('')
    setAlumnoEncontrado(null)
    setComisionesConflicto([])
    setConfirmarAgregarConConflicto(false)

    if (idBusqueda.length < 8) {
      setErrorAlumno('DNI no válido')
      return
    }
    const dniNum = Number(idBusqueda)

    try {
      setBuscando(true)
      const usuario = await usuarioServicio.obtenerPorDni(dniNum, token ?? undefined) as UsuarioBusquedaPorDni
      const esEstudiante = usuario.roles?.some((r) => r.rol?.nombre_rol === 'estudiante')

      if (!esEstudiante) {
        setErrorAlumno('El usuario no tiene rol de estudiante y no puede ser inscripto')
        return
      }
      if (alumnos.some((a) => a.usuario.id_usuario === usuario.id_usuario)) {
        setErrorAlumno('El alumno ya está activo en esta comisión')
        return
      }
      if (alumnosDadosDeBaja.some((a) => a.usuario.id_usuario === usuario.id_usuario)) {
        setErrorAlumno('Este alumno está dado de baja. Usá el botón Reincorporar en la sección de bajas.')
        return
      }

      const todasLasComisiones = await api.get<ItemComisionConEstado[]>(
        `/usuarios/${usuario.id_usuario}/comisiones`,
        token ?? undefined,
      )
      const conflictos: ComisionConflicto[] = todasLasComisiones
        .filter(
          ({ estado, comision: c }) =>
            estado === 'ACTIVO' &&
            c.materia.id_materia === comision.materia.id_materia &&
            c.id_comision !== comision.id_comision,
        )
        .map(({ comision: c }) => ({
          id_comision: c.id_comision,
          numero_comision: c.numero_comision,
          nombre_comision: c.nombre_comision,
        }))
      setComisionesConflicto(conflictos)

      setAlumnoEncontrado({
        estado: 'ACTIVO' as EstadoInscripcion,
        usuario: {
          id_usuario: usuario.id_usuario,
          nombre_usuario: usuario.nombre_usuario,
          apellido_usuario: usuario.apellido_usuario,
          correo: usuario.correo,
        },
      })
    } catch {
      setErrorAlumno('No existe ningún usuario con ese DNI')
    } finally {
      setBuscando(false)
    }
  }

  async function ejecutarAgregarAlumno() {
    if (!alumnoEncontrado || procesando) return
    setProcesando(true)
    try {
      for (const c of comisionesConflicto) {
        await comisionServicio.darBajaEstudiante(c.id_comision, alumnoEncontrado.usuario.id_usuario, token ?? undefined)
      }
      await comisionServicio.agregarEstudiante(comision.id_comision, alumnoEncontrado.usuario.id_usuario, token ?? undefined)
      actualizarListas([...alumnos, alumnoEncontrado], alumnosDadosDeBaja)
      mostrarExito(
        `${alumnoEncontrado.usuario.nombre_usuario} ${alumnoEncontrado.usuario.apellido_usuario} fue incorporado a la comision ${comision.numero_comision ?? comision.id_comision}`,
      )
      setAlumnoEncontrado(null)
      setIdBusqueda('')
      setErrorAlumno('')
      setComisionesConflicto([])
      setConfirmarAgregarConConflicto(false)
    } catch {
      setErrorAlumno('No se pudo inscribir al alumno. Intentá de nuevo.')
      setConfirmarAgregarConConflicto(false)
    } finally {
      setProcesando(false)
    }
  }

  function confirmarAgregarAlumno() {
    if (!alumnoEncontrado || procesando) return
    if (comisionesConflicto.length > 0) {
      setConfirmarAgregarConConflicto(true)
      return
    }
    ejecutarAgregarAlumno()
  }

  return (
    <div className="space-y-6">
      {mensaje && <BannerExito mensaje={mensaje} />}

      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Agregar alumno</h2>

        <form onSubmit={buscarAlumno} className="flex gap-3">
          <input
            type="text"
            inputMode="numeric"
            maxLength={8}
            value={idBusqueda}
            onChange={(e) => {
              setIdBusqueda(e.target.value.replace(/\D/g, '').slice(0, 8))
              setAlumnoEncontrado(null)
              setErrorAlumno('')
            }}
            placeholder="DNI del alumno"
            className="flex-1 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
          />
          <button
            type="submit"
            disabled={buscando}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
          >
            {buscando ? 'Buscando...' : 'Buscar'}
          </button>
        </form>

        {errorAlumno && <p className="mt-2 text-xs text-red-500">{errorAlumno}</p>}

        {alumnoEncontrado && (
          <div className="mt-4 space-y-4">
            <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-800 dark:bg-indigo-900/20">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-indigo-600 dark:text-indigo-400">Datos del alumno</p>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-xs text-gray-500 dark:text-gray-400">Nombre</dt>
                  <dd className="font-medium text-gray-900 dark:text-gray-100">{alumnoEncontrado.usuario.nombre_usuario}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500 dark:text-gray-400">Apellido</dt>
                  <dd className="font-medium text-gray-900 dark:text-gray-100">{alumnoEncontrado.usuario.apellido_usuario}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500 dark:text-gray-400">ID de usuario</dt>
                  <dd className="font-medium text-gray-900 dark:text-gray-100">{alumnoEncontrado.usuario.id_usuario}</dd>
                </div>
                <div className="col-span-2 sm:col-span-3">
                  <dt className="text-xs text-gray-500 dark:text-gray-400">Correo</dt>
                  <dd className="font-medium text-gray-900 dark:text-gray-100">{alumnoEncontrado.usuario.correo}</dd>
                </div>
              </dl>
            </div>

            {confirmarAgregarConConflicto ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/50 dark:bg-amber-900/20">
                <p className="mb-3 text-sm text-amber-800 dark:text-amber-300">
                  ¿Seguro que querés añadir a{' '}
                  <span className="font-semibold">
                    {alumnoEncontrado.usuario.nombre_usuario} {alumnoEncontrado.usuario.apellido_usuario}
                  </span>{' '}
                  a esta comisión? Ya se encuentra en{' '}
                  {comisionesConflicto.map((c) => `la comisión ${c.numero_comision ?? c.id_comision}`).join(' y ')}. Una vez
                  agregado, se dará de baja automáticamente en{' '}
                  {comisionesConflicto.length === 1 ? 'la otra' : 'las otras'}.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={ejecutarAgregarAlumno}
                    disabled={procesando}
                    className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
                  >
                    {procesando ? 'Agregando...' : 'Confirmar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmarAgregarConConflicto(false)}
                    className="rounded-lg border border-gray-300 px-4 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={confirmarAgregarAlumno}
                  disabled={procesando}
                  className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                >
                  {procesando ? 'Agregando...' : 'Agregar alumno'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAlumnoEncontrado(null)
                    setIdBusqueda('')
                    setComisionesConflicto([])
                  }}
                  className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="border-b border-gray-100 px-5 py-3 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Alumnos inscriptos</h2>
        </div>

        <div className="border-b border-gray-100 px-5 py-3 dark:border-gray-700">
          <input
            type="text"
            value={busquedaAlumnos}
            onChange={(e) => setBusquedaAlumnos(e.target.value)}
            placeholder="Buscar por ID de usuario o nombre..."
            className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
          />
        </div>

        {alumnoAConfirmarBaja && (
          <div className="flex items-center justify-between gap-4 border-b border-amber-100 bg-amber-50 px-5 py-3 dark:border-amber-800/40 dark:bg-amber-900/20">
            <p className="text-sm text-amber-800 dark:text-amber-300">
              ¿Dar de baja a{' '}
              <span className="font-semibold">
                {alumnoAConfirmarBaja.usuario.nombre_usuario} {alumnoAConfirmarBaja.usuario.apellido_usuario}
              </span>
              ?
            </p>
            <div className="flex shrink-0 gap-2">
              <button
                onClick={confirmarBajaAlumno}
                disabled={procesando}
                className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-60"
              >
                Confirmar
              </button>
              <button
                onClick={() => setAlumnoAConfirmarBaja(null)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {(() => {
          const alumnosFiltrados = alumnos.filter((a) =>
            `${a.usuario.nombre_usuario} ${a.usuario.apellido_usuario} ${a.usuario.id_usuario}`
              .toLowerCase()
              .includes(busquedaAlumnos.toLowerCase()),
          )
          if (alumnos.length === 0) {
            return <p className="px-5 py-10 text-center text-sm text-gray-400 dark:text-gray-500">No hay alumnos en la comision</p>
          }
          if (alumnosFiltrados.length === 0) {
            return <p className="px-5 py-8 text-center text-sm text-gray-400 dark:text-gray-500">No se encontraron alumnos con ese criterio</p>
          }
          return (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {alumnosFiltrados.map((alumno) => (
                <div key={alumno.usuario.id_usuario} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                      {alumno.usuario.nombre_usuario[0]}{alumno.usuario.apellido_usuario[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {alumno.usuario.nombre_usuario} {alumno.usuario.apellido_usuario}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        ID: {alumno.usuario.id_usuario} · {alumno.usuario.correo}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => solicitarBajaAlumno(alumno.usuario.id_usuario)}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 hover:text-red-600 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    Dar de baja
                  </button>
                </div>
              ))}
            </div>
          )
        })()}
      </div>

      {alumnosDadosDeBaja.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="border-b border-gray-100 px-5 py-3 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Dados de baja</h2>
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600 dark:bg-red-900/30 dark:text-red-400">
                {alumnosDadosDeBaja.length}
              </span>
            </div>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {alumnosDadosDeBaja.map((alumno) => (
              <div key={alumno.usuario.id_usuario} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-400 dark:bg-gray-700 dark:text-gray-500">
                    {alumno.usuario.nombre_usuario[0]}{alumno.usuario.apellido_usuario[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-400 line-through dark:text-gray-500">
                      {alumno.usuario.nombre_usuario} {alumno.usuario.apellido_usuario}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      ID: {alumno.usuario.id_usuario} · {alumno.usuario.correo}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => reincorporarAlumno(alumno.usuario.id_usuario)}
                  disabled={procesando}
                  className="rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 disabled:opacity-60 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-900/20"
                >
                  Reincorporar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

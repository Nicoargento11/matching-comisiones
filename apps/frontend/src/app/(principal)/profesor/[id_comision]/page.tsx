'use client'

// vista de gestion de una comision especifica del profesor
// permite ver alumnos agregar alumnos y gestionar el calendario
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import InsigniaHorario from '@/componentes/interfaz/InsigniaHorario'
import InsigniaModalidad from '@/componentes/interfaz/InsigniaModalidad'
import CalendarioCuadriculado from '@/componentes/funcionalidades/CalendarioCuadriculado'

import { comisionServicio } from '@/servicios/comisionServicio'
import { usuarioServicio } from '@/servicios/usuarioServicio'
import {
  Horario, Evento, Comision, FormatoClase, TipoEvento,
  UsuarioInComision, EstadoInscripcion, OrigenEvento,
} from '@/tipos'

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado']
const FORMATOS_CLASE: FormatoClase[] = ['TEORICO', 'PRACTICO', 'TEORICO_PRACTICO']
const MODALIDADES = ['presencial', 'virtual', 'hibrido']

const etiquetaFormato: Record<FormatoClase, string> = {
  TEORICO: 'Teorico',
  PRACTICO: 'Practico',
  TEORICO_PRACTICO: 'Teo/Prac',
}

const etiquetaEvento: Record<TipoEvento, string> = {
  CLASE:      'Clase',
  PARCIAL:    'Parcial',
  ENTREGA_TP: 'Entrega TP',
  OTRO:       'Otro',
}

const colorEvento: Record<TipoEvento, string> = {
  CLASE:      'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  PARCIAL:    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  ENTREGA_TP: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  OTRO:       'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400',
}

const tiposEvento: TipoEvento[] = ['PARCIAL', 'ENTREGA_TP', 'OTRO']

export default function paginaGestionComision() {
  const params = useParams()
  const id_comision = params.id_comision as string

  const [comisionInicial, setComisionInicial] = useState<Comision | null>(null)
  const [cargando, setCargando] = useState(true)
  const [alumnos, setAlumnos] = useState<UsuarioInComision[]>([])
  const [alumnosDadosDeBaja, setAlumnosDadosDeBaja] = useState<UsuarioInComision[]>([])
  const [alumnoAConfirmarBaja, setAlumnoAConfirmarBaja] = useState<UsuarioInComision | null>(null)
  const [busquedaAlumnos, setBusquedaAlumnos] = useState('')
  const [horarios, setHorarios] = useState<Horario[]>([])
  const [eventos, setEventos] = useState<Evento[]>([])

  useEffect(() => {
    comisionServicio.obtenerPorId(Number(id_comision))
      .then((c) => {
        setComisionInicial(c)
        setAlumnos(c.usuarios ?? [])
        setHorarios(c.horarios)
        setEventos(c.eventos ?? [])
      })
      .catch(() => setComisionInicial(null))
      .finally(() => setCargando(false))
  }, [id_comision])

  const [mensajeExito, setMensajeExito] = useState('')

  const [idBusqueda, setIdBusqueda] = useState('')
  const [alumnoEncontrado, setAlumnoEncontrado] = useState<UsuarioInComision | null>(null)
  const [errorAlumno, setErrorAlumno] = useState('')

  const [nuevoHorario, setNuevoHorario] = useState({
    diaNombre: 'Lunes',
    hora_inicio: '',
    hora_fin: '',
    aula: '',
    formato: 'TEORICO' as FormatoClase,
    modalidad: 'presencial',
  })
  const [errorHorario, setErrorHorario] = useState('')

  const [nuevoEvento, setNuevoEvento] = useState({
    titulo: '',
    tipo: 'PARCIAL' as TipoEvento,
    fecha: '',
    hora: '',
    horaFin: '',
  })
  const [errorEvento, setErrorEvento] = useState('')

  const [tabActivo, setTabActivo] = useState<'alumnos' | 'calendario'>('alumnos')

  const comisionActualizada: Comision = { ...comisionInicial, horarios, eventos }

  // ─── alumnos ───────────────────────────────────────────

  function solicitarBajaAlumno(idUsuario: number) {
    const alumno = alumnos.find((a) => a.usuario.id_usuario === idUsuario)
    if (!alumno) return
    setAlumnoAConfirmarBaja(alumno)
  }

  // TODO llamar al servicio de NestJS para marcar la inscripcion como inactiva
  function confirmarBajaAlumno() {
    if (!alumnoAConfirmarBaja) return
    setAlumnos((prev) => prev.filter((a) => a.usuario.id_usuario !== alumnoAConfirmarBaja.usuario.id_usuario))
    setAlumnosDadosDeBaja((prev) => [...prev, alumnoAConfirmarBaja])
    setAlumnoAConfirmarBaja(null)
  }

  // TODO llamar al servicio de NestJS para reactivar la inscripcion
  function reincorporarAlumno(idUsuario: number) {
    const alumno = alumnosDadosDeBaja.find((a) => a.usuario.id_usuario === idUsuario)
    if (!alumno) return
    setAlumnosDadosDeBaja((prev) => prev.filter((a) => a.usuario.id_usuario !== idUsuario))
    setAlumnos((prev) => [...prev, alumno])
    setMensajeExito(`El alumno ${alumno.usuario.nombre_usuario} ${alumno.usuario.apellido_usuario} fue reincorporado a la comision`)
    setTimeout(() => setMensajeExito(''), 4000)
  }

  const [buscando, setBuscando] = useState(false)

  async function buscarAlumno(e: React.FormEvent) {
    e.preventDefault()
    setErrorAlumno('')
    setAlumnoEncontrado(null)
    const idNum = Number(idBusqueda)
    if (!idBusqueda || idNum <= 0) {
      setErrorAlumno('Ingresa un ID de usuario válido')
      return
    }

    try {
      setBuscando(true)
      const usuario = await usuarioServicio.obtenerPorId(idNum)

      const esAlumno = (usuario as any).roles?.some((r: { id_rol: number }) => r.id_rol === 1)
      if (!esAlumno) {
        setErrorAlumno('El usuario no tiene rol de alumno y no puede ser inscripto')
        return
      }

      if (alumnos.some((a) => a.usuario.id_usuario === idNum)) {
        setErrorAlumno('El alumno ya está inscripto en esta comisión')
        return
      }

      setAlumnoEncontrado({
        estado: 'ACTIVO' as EstadoInscripcion,
        usuario: { id_usuario: usuario.id_usuario, nombre_usuario: usuario.nombre_usuario, apellido_usuario: usuario.apellido_usuario, correo: usuario.correo },
      })
    } catch {
      setErrorAlumno('No existe ningún usuario con ese ID')
    } finally {
      setBuscando(false)
    }
  }

  function mostrarMensajeExitoIncorporacion(nombre: string, apellido: string, nroComision: number | null | undefined) {
    const nro = nroComision ?? comisionInicial.id_comision
    setMensajeExito(`El alumno ${nombre} ${apellido} fue incorporado a la comision ${nro}`)
    setTimeout(() => setMensajeExito(''), 4000)
  }

  async function confirmarAgregarAlumno() {
    if (!alumnoEncontrado) return
    try {
      await comisionServicio.agregarEstudiante(comisionInicial.id_comision, alumnoEncontrado.usuario.id_usuario)
      setAlumnos((prev) => [...prev, alumnoEncontrado])
      mostrarMensajeExitoIncorporacion(alumnoEncontrado.usuario.nombre_usuario, alumnoEncontrado.usuario.apellido_usuario, comisionInicial.numero_comision)
      setAlumnoEncontrado(null)
      setIdBusqueda('')
      setErrorAlumno('')
    } catch {
      setErrorAlumno('No se pudo inscribir al alumno. Intentá de nuevo.')
    }
  }

  // ─── horarios ──────────────────────────────────────────

  function mostrarMensajeExitoHorario(diaNombre: string, hora_inicio: string, hora_fin: string) {
    setMensajeExito(`Horario del ${diaNombre} de ${hora_inicio} a ${hora_fin} guardado correctamente`)
    setTimeout(() => setMensajeExito(''), 4000)
  }

  async function agregarHorario(e: React.FormEvent) {
    e.preventDefault()
    setErrorHorario('')
    if (!nuevoHorario.hora_inicio || !nuevoHorario.hora_fin) {
      setErrorHorario('Completa los campos de hora de inicio y fin')
      return
    }
    if (nuevoHorario.hora_inicio >= nuevoHorario.hora_fin) {
      setErrorHorario('La hora de fin debe ser mayor a la hora de inicio')
      return
    }
    try {
      const horarioGuardado = await comisionServicio.agregarHorario(comisionInicial.id_comision, {
        hora_inicio: nuevoHorario.hora_inicio,
        hora_fin: nuevoHorario.hora_fin,
        nombre_dia: nuevoHorario.diaNombre,
        nombre_modalidad: nuevoHorario.modalidad,
        formato: nuevoHorario.formato,
      })
      setHorarios((prev) => [...prev, horarioGuardado])
      mostrarMensajeExitoHorario(nuevoHorario.diaNombre, nuevoHorario.hora_inicio, nuevoHorario.hora_fin)
      setNuevoHorario({ diaNombre: 'Lunes', hora_inicio: '', hora_fin: '', aula: '', formato: 'TEORICO', modalidad: 'presencial' })
    } catch {
      setErrorHorario('No se pudo guardar el horario. Verificá que el día y la modalidad existan en el sistema.')
    }
  }

  async function eliminarHorario(idHorario: number) {
    try {
      await comisionServicio.eliminarHorario(comisionInicial.id_comision, idHorario)
      setHorarios((prev) => prev.filter((h) => h.id_horario_comision !== idHorario))
    } catch {
      setMensajeExito('')
    }
  }

  // ─── eventos ───────────────────────────────────────────

  function mostrarMensajeExitoEvento(titulo: string) {
    setMensajeExito(`El evento "${titulo}" fue guardado correctamente`)
    setTimeout(() => setMensajeExito(''), 4000)
  }

  async function agregarEvento(e: React.FormEvent) {
    e.preventDefault()
    setErrorEvento('')
    if (!nuevoEvento.titulo.trim() || !nuevoEvento.fecha || !nuevoEvento.hora) {
      setErrorEvento('Completa título, fecha y hora de inicio')
      return
    }
    if (!nuevoEvento.horaFin) {
      setErrorEvento('La hora de fin es obligatoria')
      return
    }
    if (nuevoEvento.horaFin <= nuevoEvento.hora) {
      setErrorEvento('La hora de fin debe ser mayor a la hora de inicio')
      return
    }
    try {
      const fecha_inicio = `${nuevoEvento.fecha}T${nuevoEvento.hora}:00`
      const fecha_fin = `${nuevoEvento.fecha}T${nuevoEvento.horaFin}:00`
      const eventoGuardado = await comisionServicio.agregarEvento(comisionInicial.id_comision, {
        titulo: nuevoEvento.titulo.trim(),
        tipo_evento: nuevoEvento.tipo,
        fecha_inicio,
        fecha_fin,
        origen: 'PROFESOR',
        id_usuario: comisionInicial.profesor.id_usuario,
        id_materia: comisionInicial.materia.id_materia,
      })
      setEventos((prev) => [...prev, eventoGuardado])
      mostrarMensajeExitoEvento(eventoGuardado.titulo)
      setNuevoEvento({ titulo: '', tipo: 'PARCIAL', fecha: '', hora: '', horaFin: '' })
    } catch {
      setErrorEvento('No se pudo guardar el evento. Intentá de nuevo.')
    }
  }

  async function eliminarEvento(idEvento: number) {
    try {
      await comisionServicio.eliminarEvento(comisionInicial.id_comision, idEvento)
      setEventos((prev) => prev.filter((ev) => ev.id_evento !== idEvento))
    } catch {
      setMensajeExito('')
    }
  }

  // ─── render ────────────────────────────────────────────

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-gray-400 dark:text-gray-500">Cargando...</p>
      </div>
    )
  }

  if (!comisionInicial) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-gray-500 dark:text-gray-400">No se encontro la comision</p>
        <Link href="/profesor" className="mt-4 text-sm text-indigo-600 hover:underline dark:text-indigo-400">
          Volver a mis comisiones
        </Link>
      </div>
    )
  }

  const profesor = comisionInicial.profesor

  return (
    <div className="space-y-8">
      {/* navegacion de retorno */}
      <Link
        href="/profesor"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
      >
        ← Mis comisiones
      </Link>

      {/* encabezado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Prof. {profesor.nombre_usuario} {profesor.apellido_usuario}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{profesor.correo}</p>
        </div>

        <div
          className="self-start rounded-xl border px-4 py-3"
          style={{
            borderColor: comisionInicial.materia.color + '40',
            backgroundColor: comisionInicial.materia.color + '10',
          }}
        >
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            {comisionInicial.materia.nombre_materia}
          </p>
          {comisionInicial.numero_comision != null && (
            <p className="text-xs text-gray-500 dark:text-gray-400">Comision {comisionInicial.numero_comision}</p>
          )}
        </div>
      </div>

      {/* banner de exito global */}
      {mensajeExito && (
        <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 shrink-0">
            <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
          </svg>
          {mensajeExito}
        </div>
      )}

      {/* tabs */}
      <div className="flex gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
        {([
          { key: 'alumnos', label: 'Alumnos', count: alumnos.length },
          { key: 'calendario', label: 'Calendario', count: horarios.length + eventos.length },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setTabActivo(tab.key)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              tabActivo === tab.key
                ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            {tab.label}
            <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ─── PANEL ALUMNOS ─────────────────────────────────── */}
      {tabActivo === 'alumnos' && (
        <div className="space-y-6">
          {/* formulario busqueda de alumno por id de usuario */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
              Agregar alumno
            </h2>

            <form onSubmit={buscarAlumno} className="flex gap-3">
              <input
                type="text"
                inputMode="numeric"
                value={idBusqueda}
                onChange={(e) => {
                  const soloNumeros = e.target.value.replace(/\D/g, '')
                  setIdBusqueda(soloNumeros)
                  setAlumnoEncontrado(null)
                  setErrorAlumno('')
                }}
                placeholder="ID de usuario del alumno"
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
                  <p className="mb-3 text-xs font-medium uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                    Datos del alumno
                  </p>
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
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={confirmarAgregarAlumno}
                    className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    Agregar alumno
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAlumnoEncontrado(null); setIdBusqueda('') }}
                    className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* lista de alumnos activos */}
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
                  ¿Dar de baja a <span className="font-semibold">{alumnoAConfirmarBaja.usuario.nombre_usuario} {alumnoAConfirmarBaja.usuario.apellido_usuario}</span>?
                </p>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={confirmarBajaAlumno}
                    className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600"
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
                  .includes(busquedaAlumnos.toLowerCase())
              )
              if (alumnos.length === 0) {
                return (
                  <p className="px-5 py-10 text-center text-sm text-gray-400 dark:text-gray-500">
                    No hay alumnos en la comision
                  </p>
                )
              }
              if (alumnosFiltrados.length === 0) {
                return (
                  <p className="px-5 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
                    No se encontraron alumnos con ese criterio
                  </p>
                )
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
                            ID: {alumno.usuario.id_usuario} &middot; {alumno.usuario.correo}
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

          {/* lista de alumnos dados de baja */}
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
                          ID: {alumno.usuario.id_usuario} &middot; {alumno.usuario.correo}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => reincorporarAlumno(alumno.usuario.id_usuario)}
                      className="rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-900/20"
                    >
                      Reincorporar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── PANEL CALENDARIO ──────────────────────────────── */}
      {tabActivo === 'calendario' && (
        <div className="space-y-8">

          {/* ─ HORARIOS RECURRENTES ─ */}
          <section className="space-y-4">
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200">Horarios semanales</h2>
            <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-4 text-sm font-medium text-gray-600 dark:text-gray-400">Agregar horario recurrente</h3>
              <form onSubmit={agregarHorario} className="space-y-3">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Dia</label>
                    <select value={nuevoHorario.diaNombre}
                      onChange={(e) => setNuevoHorario((p) => ({ ...p, diaNombre: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    >
                      {DIAS_SEMANA.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Inicio</label>
                    <input type="time" value={nuevoHorario.hora_inicio}
                      onChange={(e) => setNuevoHorario((p) => ({ ...p, hora_inicio: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Fin</label>
                    <input type="time" value={nuevoHorario.hora_fin}
                      onChange={(e) => setNuevoHorario((p) => ({ ...p, hora_fin: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Formato</label>
                    <select value={nuevoHorario.formato}
                      onChange={(e) => setNuevoHorario((p) => ({ ...p, formato: e.target.value as FormatoClase }))}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    >
                      {FORMATOS_CLASE.map((f) => (
                        <option key={f} value={f}>{etiquetaFormato[f]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Modalidad</label>
                    <select value={nuevoHorario.modalidad}
                      onChange={(e) => setNuevoHorario((p) => ({ ...p, modalidad: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    >
                      {MODALIDADES.map((m) => (
                        <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Aula (opcional)</label>
                    <input type="text" value={nuevoHorario.aula}
                      onChange={(e) => setNuevoHorario((p) => ({ ...p, aula: e.target.value }))}
                      placeholder="Ej: Aula 101 - Edificio Central"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
                    />
                  </div>
                </div>
                {errorHorario && <p className="text-xs text-red-500">{errorHorario}</p>}
                <button type="submit" className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  Guardar horario
                </button>
              </form>
            </div>

            {horarios.length > 0 && (
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {horarios.map((h) => (
                    <div key={h.id_horario_comision} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="w-20 text-sm font-medium text-gray-700 dark:text-gray-300">{h.dia.nombre_dia}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{h.hora_inicio} – {h.hora_fin}</span>
                        {h.aula && <span className="text-xs text-gray-400 dark:text-gray-500">{h.aula.nombre}</span>}
                        <InsigniaHorario formato={h.formato} />
                        <InsigniaModalidad modalidad={h.modalidad.nombre_modalidad} />
                      </div>
                      <button onClick={() => eliminarHorario(h.id_horario_comision)} className="text-xs text-red-400 hover:text-red-600 dark:hover:text-red-400">
                        Eliminar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* ─ EVENTOS ESPECIFICOS ─ */}
          <section className="space-y-4">
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200">Eventos y evaluaciones</h2>
            <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-4 text-sm font-medium text-gray-600 dark:text-gray-400">Agregar evento (parcial, entrega TP u otro)</h3>
              <form onSubmit={agregarEvento} className="space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Titulo del evento</label>
                    <input type="text" value={nuevoEvento.titulo}
                      onChange={(e) => setNuevoEvento((p) => ({ ...p, titulo: e.target.value }))}
                      placeholder="Ej: Parcial 1er Cuatrimestre"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Tipo</label>
                    <select value={nuevoEvento.tipo}
                      onChange={(e) => setNuevoEvento((p) => ({ ...p, tipo: e.target.value as TipoEvento }))}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    >
                      {tiposEvento.map((t) => (
                        <option key={t} value={t}>{etiquetaEvento[t]}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Fecha</label>
                    <input type="date" value={nuevoEvento.fecha}
                      onChange={(e) => setNuevoEvento((p) => ({ ...p, fecha: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Hora inicio</label>
                    <input type="time" value={nuevoEvento.hora}
                      onChange={(e) => setNuevoEvento((p) => ({ ...p, hora: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Hora fin</label>
                    <input type="time" value={nuevoEvento.horaFin}
                      onChange={(e) => setNuevoEvento((p) => ({ ...p, horaFin: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                </div>
                {errorEvento && <p className="text-xs text-red-500">{errorEvento}</p>}
                <button type="submit" className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  Guardar evento
                </button>
              </form>
            </div>

            {eventos.length > 0 && (
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {eventos.map((ev) => {
                    const fechaStr = ev.fecha_inicio.slice(0, 10)
                    const horaStr = ev.fecha_inicio.slice(11, 16)
                    const horaFinStr = ev.fecha_fin !== ev.fecha_inicio ? ev.fecha_fin.slice(11, 16) : null
                    return (
                      <div key={ev.id_evento} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <div className="flex items-center gap-4">
                          <div className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: comisionInicial.materia.color }} />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{ev.titulo}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              {fechaStr} &middot; {horaStr}{horaFinStr ? ` – ${horaFinStr}` : ''}
                            </p>
                          </div>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colorEvento[ev.tipo_evento]}`}>
                            {etiquetaEvento[ev.tipo_evento]}
                          </span>
                        </div>
                        <button onClick={() => eliminarEvento(ev.id_evento)} className="text-xs text-red-400 hover:text-red-600 dark:hover:text-red-400">
                          Eliminar
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </section>

          {/* ─ CALENDARIO DE LA COMISION ─ */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200">Vista del calendario</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Asi ven los estudiantes el calendario de esta comision
            </p>
            <CalendarioCuadriculado
              comisiones={[comisionActualizada]}
              materiaDestacadaId={comisionInicial.materia.id_materia}
            />
          </section>
        </div>
      )}
    </div>
  )
}

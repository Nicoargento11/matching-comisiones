'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import InsigniaHorario from '@/componentes/interfaz/InsigniaHorario'
import InsigniaModalidad from '@/componentes/interfaz/InsigniaModalidad'
import CalendarioCuadriculado from '@/componentes/funcionalidades/CalendarioCuadriculado'
import { comisionServicio } from '@/servicios/comisionServicio'
import { usuarioServicio } from '@/servicios/usuarioServicio'
import { getSupabaseClient } from '@/src/lib/supabase'
import { Comision, EstadoInscripcion, Evento, FormatoClase, Horario, TipoEvento, UsuarioInComision } from '@/tipos'

type UsuarioBusquedaPorDni = {
  id_usuario: number
  nombre_usuario: string
  apellido_usuario: string
  correo: string
  roles?: { rol?: { nombre_rol?: string } }[]
}

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado']
const FORMATOS_CLASE: FormatoClase[] = ['TEORICO', 'PRACTICO', 'TEORICO_PRACTICO']
const MODALIDADES = ['presencial', 'virtual', 'hibrido']
const TIPOS_EVENTO: TipoEvento[] = ['PARCIAL', 'ENTREGA_TP', 'OTRO']

const etiquetaFormato: Record<FormatoClase, string> = {
  TEORICO: 'Teorico',
  PRACTICO: 'Practico',
  TEORICO_PRACTICO: 'Teo/Prac',
}

const etiquetaEvento: Record<TipoEvento, string> = {
  CLASE: 'Clase',
  PARCIAL: 'Parcial',
  ENTREGA_TP: 'Entrega TP',
  OTRO: 'Otro',
}

const colorEvento: Record<TipoEvento, string> = {
  CLASE: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  PARCIAL: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  ENTREGA_TP: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  OTRO: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400',
}

function seSuperponeHorario(a: { hora_inicio: string; hora_fin: string }, b: { hora_inicio: string; hora_fin: string }) {
  return a.hora_inicio < b.hora_fin && a.hora_fin > b.hora_inicio
}

function BannerExito({ mensaje }: { mensaje: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 shrink-0">
        <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
      </svg>
      {mensaje}
    </div>
  )
}

export default function PaginaGestionComision() {
  const params = useParams()
  const id_comision = params.id_comision as string

  const [token, setToken] = useState<string | null>(null)
  const [comisionInicial, setComisionInicial] = useState<Comision | null>(null)
  const [cargando, setCargando] = useState(true)

  const [alumnos, setAlumnos] = useState<UsuarioInComision[]>([])
  const [alumnosDadosDeBaja, setAlumnosDadosDeBaja] = useState<UsuarioInComision[]>([])
  const [alumnoAConfirmarBaja, setAlumnoAConfirmarBaja] = useState<UsuarioInComision | null>(null)
  const [busquedaAlumnos, setBusquedaAlumnos] = useState('')

  const [horarios, setHorarios] = useState<Horario[]>([])
  const [eventos, setEventos] = useState<Evento[]>([])
  const [horariosDadosDeBaja, setHorariosDadosDeBaja] = useState<Horario[]>([])
  const [eventosDadosDeBaja, setEventosDadosDeBaja] = useState<Evento[]>([])

  const [mensajeAlumnos, setMensajeAlumnos] = useState('')
  const [mensajeHorario, setMensajeHorario] = useState('')
  const [mensajeEvento, setMensajeEvento] = useState('')
  const [tabActivo, setTabActivo] = useState<'alumnos' | 'calendario'>('alumnos')

  const [idBusqueda, setIdBusqueda] = useState('')
  const [alumnoEncontrado, setAlumnoEncontrado] = useState<UsuarioInComision | null>(null)
  const [errorAlumno, setErrorAlumno] = useState('')
  const [buscando, setBuscando] = useState(false)

  const [nuevoHorario, setNuevoHorario] = useState({
    diaNombre: 'Lunes',
    hora_inicio: '',
    hora_fin: '',
    aula: '',
    formato: 'TEORICO' as FormatoClase,
    modalidad: 'presencial',
  })
  const [errorHorario, setErrorHorario] = useState('')
  const [guardandoHorario, setGuardandoHorario] = useState(false)
  const [editandoHorario, setEditandoHorario] = useState<Horario | null>(null)
  const [confirmandoCambiosHorario, setConfirmandoCambiosHorario] = useState(false)
  const [horarioAConfirmarEliminar, setHorarioAConfirmarEliminar] = useState<Horario | null>(null)

  const [nuevoEvento, setNuevoEvento] = useState({
    titulo: '',
    tipo: 'PARCIAL' as TipoEvento,
    fecha: '',
    hora: '',
    horaFin: '',
  })
  const [errorEvento, setErrorEvento] = useState('')
  const [guardandoEvento, setGuardandoEvento] = useState(false)
  const [editandoEvento, setEditandoEvento] = useState<Evento | null>(null)
  const [confirmandoCambiosEvento, setConfirmandoCambiosEvento] = useState(false)
  const [eventoAConfirmarEliminar, setEventoAConfirmarEliminar] = useState<Evento | null>(null)

  useEffect(() => {
    async function cargar() {
      const { data } = await getSupabaseClient().auth.getSession()
      const t = data.session?.access_token ?? null
      setToken(t)
      const c = await comisionServicio.obtenerPorId(Number(id_comision), t ?? undefined)
      setComisionInicial(c)
      setAlumnos(c.usuarios ?? [])
      setHorarios(c.horarios)
      setEventos(c.eventos ?? [])
    }
    cargar().catch(() => setComisionInicial(null)).finally(() => setCargando(false))
  }, [id_comision])

  function mostrarExitoAlumnos(msg: string) {
    setMensajeAlumnos(msg)
    setTimeout(() => setMensajeAlumnos(''), 4000)
  }
  function mostrarExitoHorario(msg: string) {
    setMensajeHorario(msg)
    setTimeout(() => setMensajeHorario(''), 4000)
  }
  function mostrarExitoEvento(msg: string) {
    setMensajeEvento(msg)
    setTimeout(() => setMensajeEvento(''), 4000)
  }

  function resetFormHorario() {
    setNuevoHorario({ diaNombre: 'Lunes', hora_inicio: '', hora_fin: '', aula: '', formato: 'TEORICO', modalidad: 'presencial' })
    setErrorHorario('')
    setEditandoHorario(null)
    setConfirmandoCambiosHorario(false)
  }

  function resetFormEvento() {
    setNuevoEvento({ titulo: '', tipo: 'PARCIAL', fecha: '', hora: '', horaFin: '' })
    setErrorEvento('')
    setEditandoEvento(null)
    setConfirmandoCambiosEvento(false)
  }

  // alumnos
  function solicitarBajaAlumno(idUsuario: number) {
    const alumno = alumnos.find((a) => a.usuario.id_usuario === idUsuario)
    if (!alumno) return
    setAlumnoAConfirmarBaja(alumno)
  }

  async function confirmarBajaAlumno() {
    if (!alumnoAConfirmarBaja || !comisionInicial) return
    const alumno = alumnoAConfirmarBaja
    setAlumnoAConfirmarBaja(null)
    try {
      await comisionServicio.darBajaEstudiante(comisionInicial.id_comision, alumno.usuario.id_usuario, token ?? undefined)
      setAlumnos((prev) => prev.filter((a) => a.usuario.id_usuario !== alumno.usuario.id_usuario))
      setAlumnosDadosDeBaja((prev) => [...prev, alumno])
      mostrarExitoAlumnos(`${alumno.usuario.nombre_usuario} ${alumno.usuario.apellido_usuario} fue dado de baja`)
    } catch (e) {
      mostrarExitoAlumnos(`Error al dar de baja: ${e instanceof Error ? e.message : 'intentá de nuevo'}`)
    }
  }

  async function reincorporarAlumno(idUsuario: number) {
    if (!comisionInicial) return
    const alumno = alumnosDadosDeBaja.find((a) => a.usuario.id_usuario === idUsuario)
    if (!alumno) return
    try {
      await comisionServicio.agregarEstudiante(comisionInicial.id_comision, idUsuario, token ?? undefined)
      setAlumnosDadosDeBaja((prev) => prev.filter((a) => a.usuario.id_usuario !== idUsuario))
      setAlumnos((prev) => [...prev, alumno])
      mostrarExitoAlumnos(`${alumno.usuario.nombre_usuario} ${alumno.usuario.apellido_usuario} fue reincorporado`)
    } catch (e) {
      mostrarExitoAlumnos(`Error al reincorporar: ${e instanceof Error ? e.message : 'intentá de nuevo'}`)
    }
  }

  async function buscarAlumno(e: React.FormEvent) {
    e.preventDefault()
    setErrorAlumno('')
    setAlumnoEncontrado(null)

    const dniNum = Number(idBusqueda)
    if (!idBusqueda || dniNum <= 0) {
      setErrorAlumno('Ingresa un DNI válido')
      return
    }

    try {
      setBuscando(true)
      const usuario = await usuarioServicio.obtenerPorDni(dniNum, token ?? undefined) as UsuarioBusquedaPorDni
      const esEstudiante = usuario.roles?.some((r) => r.rol?.nombre_rol === 'estudiante')

      if (!esEstudiante) {
        setErrorAlumno('El usuario no tiene rol de estudiante y no puede ser inscripto')
        return
      }

      if (alumnos.some((a) => a.usuario.id_usuario === usuario.id_usuario)) {
        setErrorAlumno('El alumno ya está inscripto en esta comisión')
        return
      }

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

  async function confirmarAgregarAlumno() {
    if (!alumnoEncontrado || !comisionInicial) return
    try {
      await comisionServicio.agregarEstudiante(comisionInicial.id_comision, alumnoEncontrado.usuario.id_usuario, token ?? undefined)
      setAlumnos((prev) => [...prev, alumnoEncontrado])
      mostrarExitoAlumnos(`El alumno ${alumnoEncontrado.usuario.nombre_usuario} ${alumnoEncontrado.usuario.apellido_usuario} fue incorporado a la comision ${comisionInicial.numero_comision ?? comisionInicial.id_comision}`)
      setAlumnoEncontrado(null)
      setIdBusqueda('')
      setErrorAlumno('')
    } catch {
      setErrorAlumno('No se pudo inscribir al alumno. Intentá de nuevo.')
    }
  }

  // horarios
  function iniciarEditarHorario(h: Horario) {
    setEditandoHorario(h)
    setNuevoHorario({
      diaNombre: h.dia.nombre_dia,
      hora_inicio: h.hora_inicio,
      hora_fin: h.hora_fin,
      aula: h.aula?.nombre ?? '',
      formato: h.formato,
      modalidad: h.modalidad.nombre_modalidad.toLowerCase(),
    })
    setErrorHorario('')
    setConfirmandoCambiosHorario(false)
    setTabActivo('calendario')
  }

  function solicitarEliminarHorario(h: Horario) {
    setHorarioAConfirmarEliminar(h)
  }

  function validarSolapeHorario() {
    const otros = horarios.filter((h) => !editandoHorario || h.id_horario_comision !== editandoHorario.id_horario_comision)
    const mismosDia = otros.filter((h) => h.dia.nombre_dia.toLowerCase() === nuevoHorario.diaNombre.toLowerCase())
    if (mismosDia.some((h) => seSuperponeHorario(nuevoHorario, h))) {
      setErrorHorario('El horario se superpone con otro horario existente del mismo día')
      return false
    }
    return true
  }

  function manejarSubmitHorario(e: React.FormEvent) {
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
    if (!validarSolapeHorario()) return

    if (editandoHorario) {
      const sinCambios =
        nuevoHorario.diaNombre === editandoHorario.dia.nombre_dia &&
        nuevoHorario.hora_inicio === editandoHorario.hora_inicio &&
        nuevoHorario.hora_fin === editandoHorario.hora_fin &&
        nuevoHorario.formato === editandoHorario.formato &&
        nuevoHorario.modalidad === editandoHorario.modalidad.nombre_modalidad.toLowerCase() &&
        nuevoHorario.aula === (editandoHorario.aula?.nombre ?? '')
      if (sinCambios) {
        setErrorHorario('No se realizaron cambios. Modificá al menos un campo para guardar.')
        return
      }
      setConfirmandoCambiosHorario(true)
      return
    }

    ejecutarGuardarHorario()
  }

  async function ejecutarGuardarHorario() {
    if (!comisionInicial || guardandoHorario) return
    setGuardandoHorario(true)
    setConfirmandoCambiosHorario(false)
    try {
      if (editandoHorario) {
        await comisionServicio.eliminarHorario(comisionInicial.id_comision, editandoHorario.id_horario_comision, token ?? undefined)
      }

      const guardado = await comisionServicio.agregarHorario(
        comisionInicial.id_comision,
        {
          hora_inicio: nuevoHorario.hora_inicio,
          hora_fin: nuevoHorario.hora_fin,
          nombre_dia: nuevoHorario.diaNombre,
          nombre_modalidad: nuevoHorario.modalidad,
          formato: nuevoHorario.formato,
          ...(nuevoHorario.aula.trim() && { nombre_aula: nuevoHorario.aula.trim() }),
        },
        token ?? undefined,
      )

      if (editandoHorario) {
        setHorarios((prev) => prev.map((h) => (h.id_horario_comision === editandoHorario.id_horario_comision ? guardado : h)))
        mostrarExitoHorario('Horario actualizado correctamente')
      } else {
        setHorarios((prev) => [...prev, guardado])
        mostrarExitoHorario(`Horario del ${guardado.dia.nombre_dia} de ${guardado.hora_inicio} a ${guardado.hora_fin} guardado correctamente`)
      }

      resetFormHorario()
    } catch {
      setErrorHorario('No se pudo guardar el horario. Verificá que el día y la modalidad existan en el sistema.')
    } finally {
      setGuardandoHorario(false)
    }
  }

  async function confirmarEliminarHorario() {
    if (!horarioAConfirmarEliminar || !comisionInicial) return
    const h = horarioAConfirmarEliminar
    setHorarioAConfirmarEliminar(null)
    try {
      await comisionServicio.eliminarHorario(comisionInicial.id_comision, h.id_horario_comision, token ?? undefined)
      setHorarios((prev) => prev.filter((x) => x.id_horario_comision !== h.id_horario_comision))
      setHorariosDadosDeBaja((prev) => [...prev, h])
      mostrarExitoHorario('Horario dado de baja')
    } catch {
      mostrarExitoHorario('Error al dar de baja el horario. Intentá de nuevo.')
    }
  }

  async function reincorporarHorario(h: Horario) {
    if (!comisionInicial) return

    const mismosDia = horarios.filter((x) => x.dia.nombre_dia.toLowerCase() === h.dia.nombre_dia.toLowerCase())
    if (mismosDia.some((x) => seSuperponeHorario(h, x))) {
      mostrarExitoHorario('No se puede reincorporar: se superpone con otro horario activo del mismo día')
      return
    }

    try {
      const nuevo = await comisionServicio.agregarHorario(
        comisionInicial.id_comision,
        {
          hora_inicio: h.hora_inicio,
          hora_fin: h.hora_fin,
          nombre_dia: h.dia.nombre_dia,
          nombre_modalidad: h.modalidad.nombre_modalidad,
          formato: h.formato,
          ...(h.aula?.nombre && { nombre_aula: h.aula.nombre }),
        },
        token ?? undefined,
      )
      setHorariosDadosDeBaja((prev) => prev.filter((x) => x.id_horario_comision !== h.id_horario_comision))
      setHorarios((prev) => [...prev, nuevo])
      mostrarExitoHorario('Horario reincorporado')
    } catch {
      mostrarExitoHorario('Error al reincorporar el horario. Intentá de nuevo.')
    }
  }

  // eventos
  function iniciarEditarEvento(ev: Evento) {
    setEditandoEvento(ev)
    setNuevoEvento({
      titulo: ev.titulo,
      tipo: ev.tipo_evento,
      fecha: ev.fecha_inicio.slice(0, 10),
      hora: ev.fecha_inicio.slice(11, 16),
      horaFin: ev.fecha_fin.slice(11, 16),
    })
    setErrorEvento('')
    setConfirmandoCambiosEvento(false)
    setTabActivo('calendario')
  }

  function solicitarEliminarEvento(ev: Evento) {
    setEventoAConfirmarEliminar(ev)
  }

  function manejarSubmitEvento(e: React.FormEvent) {
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

    // intencionalmente NO validamos solape evento vs horario
    if (editandoEvento) {
      const sinCambios =
        nuevoEvento.titulo.trim() === editandoEvento.titulo &&
        nuevoEvento.tipo === editandoEvento.tipo_evento &&
        nuevoEvento.fecha === editandoEvento.fecha_inicio.slice(0, 10) &&
        nuevoEvento.hora === editandoEvento.fecha_inicio.slice(11, 16) &&
        nuevoEvento.horaFin === editandoEvento.fecha_fin.slice(11, 16)
      if (sinCambios) {
        setErrorEvento('No se realizaron cambios. Modificá al menos un campo para guardar.')
        return
      }
      setConfirmandoCambiosEvento(true)
      return
    }

    ejecutarGuardarEvento()
  }

  async function ejecutarGuardarEvento() {
    if (!comisionInicial || guardandoEvento) return
    setGuardandoEvento(true)
    setConfirmandoCambiosEvento(false)
    try {
      if (editandoEvento) {
        await comisionServicio.eliminarEvento(comisionInicial.id_comision, editandoEvento.id_evento, token ?? undefined)
      }

      const fecha_inicio = `${nuevoEvento.fecha}T${nuevoEvento.hora}:00`
      const fecha_fin = `${nuevoEvento.fecha}T${nuevoEvento.horaFin}:00`
      const guardado = await comisionServicio.agregarEvento(
        comisionInicial.id_comision,
        {
          titulo: nuevoEvento.titulo.trim(),
          tipo_evento: nuevoEvento.tipo,
          fecha_inicio,
          fecha_fin,
          origen: 'PROFESOR',
          id_usuario: comisionInicial.profesor.id_usuario,
          id_materia: comisionInicial.materia.id_materia,
        },
        token ?? undefined,
      )

      if (editandoEvento) {
        setEventos((prev) => prev.map((ev) => (ev.id_evento === editandoEvento.id_evento ? guardado : ev)))
        mostrarExitoEvento('Evento actualizado correctamente')
      } else {
        setEventos((prev) => [...prev, guardado])
        mostrarExitoEvento(`El evento "${guardado.titulo}" fue guardado correctamente`)
      }

      resetFormEvento()
    } catch {
      setErrorEvento('No se pudo guardar el evento. Intentá de nuevo.')
    } finally {
      setGuardandoEvento(false)
    }
  }

  async function confirmarEliminarEvento() {
    if (!eventoAConfirmarEliminar || !comisionInicial) return
    const ev = eventoAConfirmarEliminar
    setEventoAConfirmarEliminar(null)
    try {
      await comisionServicio.eliminarEvento(comisionInicial.id_comision, ev.id_evento, token ?? undefined)
      setEventos((prev) => prev.filter((x) => x.id_evento !== ev.id_evento))
      setEventosDadosDeBaja((prev) => [...prev, ev])
      mostrarExitoEvento('Evento dado de baja')
    } catch {
      mostrarExitoEvento('Error al dar de baja el evento. Intentá de nuevo.')
    }
  }

  async function reincorporarEvento(ev: Evento) {
    if (!comisionInicial) return
    try {
      const nuevo = await comisionServicio.agregarEvento(
        comisionInicial.id_comision,
        {
          titulo: ev.titulo,
          tipo_evento: ev.tipo_evento,
          fecha_inicio: ev.fecha_inicio,
          fecha_fin: ev.fecha_fin,
          origen: ev.origen,
          id_usuario: comisionInicial.profesor.id_usuario,
          id_materia: comisionInicial.materia.id_materia,
        },
        token ?? undefined,
      )
      setEventosDadosDeBaja((prev) => prev.filter((x) => x.id_evento !== ev.id_evento))
      setEventos((prev) => [...prev, nuevo])
      mostrarExitoEvento('Evento reincorporado')
    } catch {
      mostrarExitoEvento('Error al reincorporar el evento. Intentá de nuevo.')
    }
  }

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
  const comisionActualizada: Comision = { ...comisionInicial, horarios, eventos }

  return (
    <div className="space-y-8">
      <Link
        href="/profesor"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
      >
        ← Mis comisiones
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Prof. {profesor.nombre_usuario} {profesor.apellido_usuario}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{profesor.correo}</p>
        </div>

        <div
          className="self-start rounded-xl border px-4 py-3"
          style={{ borderColor: comisionInicial.materia.color + '40', backgroundColor: comisionInicial.materia.color + '10' }}
        >
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{comisionInicial.materia.nombre_materia}</p>
          {comisionInicial.numero_comision != null && (
            <p className="text-xs text-gray-500 dark:text-gray-400">Comision {comisionInicial.numero_comision}</p>
          )}
        </div>
      </div>

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

      {tabActivo === 'alumnos' && (
        <div className="space-y-6">
          {mensajeAlumnos && <BannerExito mensaje={mensajeAlumnos} />}
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Agregar alumno</h2>

            <form onSubmit={buscarAlumno} className="flex gap-3">
              <input
                type="text"
                inputMode="numeric"
                value={idBusqueda}
                onChange={(e) => {
                  setIdBusqueda(e.target.value.replace(/\D/g, ''))
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
                    onClick={() => {
                      setAlumnoEncontrado(null)
                      setIdBusqueda('')
                    }}
                    className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    Cancelar
                  </button>
                </div>
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
                  ¿Dar de baja a <span className="font-semibold">{alumnoAConfirmarBaja.usuario.nombre_usuario} {alumnoAConfirmarBaja.usuario.apellido_usuario}</span>?
                </p>
                <div className="flex shrink-0 gap-2">
                  <button onClick={confirmarBajaAlumno} className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600">
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
                `${a.usuario.nombre_usuario} ${a.usuario.apellido_usuario} ${a.usuario.id_usuario}`.toLowerCase().includes(busquedaAlumnos.toLowerCase()),
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
                          <p className="text-xs text-gray-400 dark:text-gray-500">ID: {alumno.usuario.id_usuario} · {alumno.usuario.correo}</p>
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
                        <p className="text-xs text-gray-400 dark:text-gray-500">ID: {alumno.usuario.id_usuario} · {alumno.usuario.correo}</p>
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

      {tabActivo === 'calendario' && (
        <div className="space-y-8">
          <section className="space-y-4">
            {mensajeHorario && <BannerExito mensaje={mensajeHorario} />}
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200">Horarios semanales</h2>
            <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                {editandoHorario ? 'Modificar horario recurrente' : 'Agregar horario recurrente'}
              </h3>

              {confirmandoCambiosHorario && (
                <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-300">
                  <span>¿Seguro que querés guardar los cambios de este horario?</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={ejecutarGuardarHorario}
                      disabled={guardandoHorario}
                      className="rounded-md bg-amber-500 px-2.5 py-1 text-white hover:bg-amber-600 disabled:opacity-60"
                    >
                      Confirmar
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmandoCambiosHorario(false)}
                      className="rounded-md border border-amber-300 px-2.5 py-1 hover:bg-amber-100 dark:border-amber-700 dark:hover:bg-amber-900/40"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={manejarSubmitHorario} className="space-y-3">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Dia</label>
                    <select
                      value={nuevoHorario.diaNombre}
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
                    <input
                      type="time"
                      value={nuevoHorario.hora_inicio}
                      onChange={(e) => setNuevoHorario((p) => ({ ...p, hora_inicio: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Fin</label>
                    <input
                      type="time"
                      value={nuevoHorario.hora_fin}
                      onChange={(e) => setNuevoHorario((p) => ({ ...p, hora_fin: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Formato</label>
                    <select
                      value={nuevoHorario.formato}
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
                    <select
                      value={nuevoHorario.modalidad}
                      onChange={(e) => setNuevoHorario((p) => ({ ...p, modalidad: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    >
                      {MODALIDADES.map((m) => (
                        <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Aula (opcional)</label>
                  <input
                    type="text"
                    value={nuevoHorario.aula}
                    onChange={(e) => setNuevoHorario((p) => ({ ...p, aula: e.target.value }))}
                    placeholder="Ej: Aula 101 - Edificio Central"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
                  />
                </div>

                {errorHorario && <p className="text-xs text-red-500">{errorHorario}</p>}

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={guardandoHorario || confirmandoCambiosHorario}
                    className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                  >
                    {guardandoHorario
                      ? 'Guardando...'
                      : editandoHorario
                        ? 'Guardar cambios'
                        : 'Guardar horario'}
                  </button>

                  {editandoHorario && (
                    <button
                      type="button"
                      onClick={resetFormHorario}
                      disabled={guardandoHorario}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-60 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      Cancelar edición
                    </button>
                  )}
                </div>
              </form>
            </div>

            {horarioAConfirmarEliminar && (
              <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-300">
                <p>
                  ¿Seguro que querés dar de baja el horario del <span className="font-semibold">{horarioAConfirmarEliminar.dia.nombre_dia}</span> de {horarioAConfirmarEliminar.hora_inicio} a {horarioAConfirmarEliminar.hora_fin}?
                </p>
                <div className="flex gap-2">
                  <button onClick={confirmarEliminarHorario} className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600">
                    Confirmar
                  </button>
                  <button
                    onClick={() => setHorarioAConfirmarEliminar(null)}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

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
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => iniciarEditarHorario(h)}
                          className="text-xs text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                          Modificar
                        </button>
                        <button
                          onClick={() => solicitarEliminarHorario(h)}
                          className="text-xs text-red-400 hover:text-red-600 dark:hover:text-red-400"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="space-y-4">
            {mensajeEvento && <BannerExito mensaje={mensajeEvento} />}
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200">Eventos y evaluaciones</h2>
            <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                {editandoEvento ? 'Modificar evento' : 'Agregar evento (parcial, entrega TP u otro)'}
              </h3>

              {confirmandoCambiosEvento && (
                <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-300">
                  <span>¿Seguro que querés guardar los cambios de este evento?</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={ejecutarGuardarEvento}
                      disabled={guardandoEvento}
                      className="rounded-md bg-amber-500 px-2.5 py-1 text-white hover:bg-amber-600 disabled:opacity-60"
                    >
                      Confirmar
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmandoCambiosEvento(false)}
                      className="rounded-md border border-amber-300 px-2.5 py-1 hover:bg-amber-100 dark:border-amber-700 dark:hover:bg-amber-900/40"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={manejarSubmitEvento} className="space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Titulo del evento</label>
                    <input
                      type="text"
                      value={nuevoEvento.titulo}
                      onChange={(e) => setNuevoEvento((p) => ({ ...p, titulo: e.target.value }))}
                      placeholder="Ej: Parcial 1er Cuatrimestre"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Tipo</label>
                    <select
                      value={nuevoEvento.tipo}
                      onChange={(e) => setNuevoEvento((p) => ({ ...p, tipo: e.target.value as TipoEvento }))}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    >
                      {TIPOS_EVENTO.map((t) => (
                        <option key={t} value={t}>{etiquetaEvento[t]}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Fecha</label>
                    <input
                      type="date"
                      value={nuevoEvento.fecha}
                      onChange={(e) => setNuevoEvento((p) => ({ ...p, fecha: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Hora inicio</label>
                    <input
                      type="time"
                      value={nuevoEvento.hora}
                      onChange={(e) => setNuevoEvento((p) => ({ ...p, hora: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Hora fin</label>
                    <input
                      type="time"
                      value={nuevoEvento.horaFin}
                      onChange={(e) => setNuevoEvento((p) => ({ ...p, horaFin: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                </div>

                {errorEvento && <p className="text-xs text-red-500">{errorEvento}</p>}

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={guardandoEvento || confirmandoCambiosEvento}
                    className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                  >
                    {guardandoEvento
                      ? 'Guardando...'
                      : editandoEvento
                        ? 'Guardar cambios'
                        : 'Guardar evento'}
                  </button>

                  {editandoEvento && (
                    <button
                      type="button"
                      onClick={resetFormEvento}
                      disabled={guardandoEvento}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-60 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      Cancelar edición
                    </button>
                  )}
                </div>
              </form>
            </div>

            {eventoAConfirmarEliminar && (
              <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-300">
                <p>
                  ¿Seguro que querés dar de baja el evento <span className="font-semibold">{eventoAConfirmarEliminar.titulo}</span>?
                </p>
                <div className="flex gap-2">
                  <button onClick={confirmarEliminarEvento} className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600">
                    Confirmar
                  </button>
                  <button
                    onClick={() => setEventoAConfirmarEliminar(null)}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

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
                              {fechaStr} · {horaStr}{horaFinStr ? ` – ${horaFinStr}` : ''}
                            </p>
                          </div>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colorEvento[ev.tipo_evento]}`}>
                            {etiquetaEvento[ev.tipo_evento]}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => iniciarEditarEvento(ev)}
                            className="text-xs text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                          >
                            Modificar
                          </button>
                          <button
                            onClick={() => solicitarEliminarEvento(ev)}
                            className="text-xs text-red-400 hover:text-red-600 dark:hover:text-red-400"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </section>

          {(horariosDadosDeBaja.length > 0 || eventosDadosDeBaja.length > 0) && (
            <section className="space-y-3 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Dados de baja (horarios y eventos)
              </h3>

              {horariosDadosDeBaja.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Horarios</p>
                  <div className="divide-y divide-gray-100 rounded-lg border border-gray-100 dark:divide-gray-700 dark:border-gray-700">
                    {horariosDadosDeBaja.map((h) => (
                      <div key={h.id_horario_comision} className="flex items-center justify-between px-4 py-3">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {h.dia.nombre_dia} · {h.hora_inicio} – {h.hora_fin}
                        </p>
                        <button
                          onClick={() => reincorporarHorario(h)}
                          className="rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-900/20"
                        >
                          Reincorporar
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {eventosDadosDeBaja.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Eventos</p>
                  <div className="divide-y divide-gray-100 rounded-lg border border-gray-100 dark:divide-gray-700 dark:border-gray-700">
                    {eventosDadosDeBaja.map((ev) => (
                      <div key={ev.id_evento} className="flex items-center justify-between px-4 py-3">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {ev.titulo} · {ev.fecha_inicio.slice(0, 10)} {ev.fecha_inicio.slice(11, 16)}
                        </p>
                        <button
                          onClick={() => reincorporarEvento(ev)}
                          className="rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-900/20"
                        >
                          Reincorporar
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200">Vista del calendario</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Asi ven los estudiantes el calendario de esta comision</p>
            <CalendarioCuadriculado comisiones={[comisionActualizada]} materiaDestacadaId={comisionInicial.materia.id_materia} />
          </section>
        </div>
      )}
    </div>
  )
}

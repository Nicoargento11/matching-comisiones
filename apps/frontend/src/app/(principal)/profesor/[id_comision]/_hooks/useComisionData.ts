import { useEffect, useState } from 'react'
import { comisionServicio } from '@/servicios/comisionServicio'
import type { Comision, Evento, Horario, UsuarioInComision } from '@/tipos'

export function useComisionData(id_comision: string, token: string | null) {
  const [comision, setComision] = useState<Comision | null>(null)
  const [cargando, setCargando] = useState(true)
  const [alumnos, setAlumnos] = useState<UsuarioInComision[]>([])
  const [alumnosDadosDeBaja, setAlumnosDadosDeBaja] = useState<UsuarioInComision[]>([])
  const [horarios, setHorarios] = useState<Horario[]>([])
  const [horariosDadosDeBaja, setHorariosDadosDeBaja] = useState<Horario[]>([])
  const [eventos, setEventos] = useState<Evento[]>([])
  const [eventosDadosDeBaja, setEventosDadosDeBaja] = useState<Evento[]>([])

  useEffect(() => {
    if (!token) return
    async function cargar() {
      const c = await comisionServicio.obtenerPorId(Number(id_comision), token ?? undefined)
      setComision(c)
      const todos = (c.usuarios ?? []) as UsuarioInComision[]
      setAlumnos(todos.filter((u) => u.estado === 'ACTIVO'))
      setAlumnosDadosDeBaja(todos.filter((u) => u.estado === 'BAJA'))
      setHorarios(c.horarios.filter((h) => h.activo))
      setHorariosDadosDeBaja(c.horarios.filter((h) => !h.activo))
      setEventos((c.eventos ?? []).filter((e) => e.activo))
      setEventosDadosDeBaja((c.eventos ?? []).filter((e) => !e.activo))
    }
    cargar().catch(() => setComision(null)).finally(() => setCargando(false))
  }, [id_comision, token])

  const comisionActualizada: Comision | null = comision
    ? { ...comision, horarios, eventos }
    : null

  return {
    comision,
    comisionActualizada,
    cargando,
    alumnos,
    alumnosDadosDeBaja,
    horarios,
    horariosDadosDeBaja,
    eventos,
    eventosDadosDeBaja,
    onAlumnosChange: (activos: UsuarioInComision[], bajas: UsuarioInComision[]) => {
      setAlumnos(activos)
      setAlumnosDadosDeBaja(bajas)
    },
    onHorariosChange: (activos: Horario[], bajas: Horario[]) => {
      setHorarios(activos)
      setHorariosDadosDeBaja(bajas)
    },
    onEventosChange: (activos: Evento[], bajas: Evento[]) => {
      setEventos(activos)
      setEventosDadosDeBaja(bajas)
    },
  }
}

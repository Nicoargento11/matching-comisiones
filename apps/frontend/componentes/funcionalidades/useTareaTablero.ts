import { useState, useCallback, useEffect, useMemo } from 'react'
import { useAuth } from '@/src/context/AuthContext'
import { tareaServicio } from '@/servicios/tareaServicio'
import { usuarioServicio } from '@/servicios/usuarioServicio'
import type { Comision, DatosTarea, EstadoTarea, Evento, TareaTablero } from '@/tipos'

export type MateriaOpcion = { id_materia: number; nombre_materia: string }
export type EventoOpcion = Pick<Evento, 'id_evento' | 'titulo' | 'tipo_evento' | 'fecha_inicio'>

export function useTareaTablero() {
  const { yo, token } = useAuth()
  const [tareas, setTareas] = useState<TareaTablero[]>([])
  const [comisiones, setComisiones] = useState<Comision[]>([])
  const [tareaArrastrada, setTareaArrastrada] = useState<string | null>(null)
  const [columnaActiva, setColumnaActiva] = useState<EstadoTarea | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (!yo) {
      setTareas([])
      setComisiones([])
      setCargando(false)
      return
    }
    setCargando(true)
    Promise.all([
      tareaServicio.obtenerPorUsuario(yo.id_usuario, token ?? undefined),
      usuarioServicio.obtenerComisiones(yo.id_usuario, token ?? undefined),
    ])
      .then(([tareasData, comisionesData]) => {
        setTareas(tareasData)
        setComisiones(comisionesData)
      })
      .catch(() => {
        setTareas([])
        setComisiones([])
      })
      .finally(() => setCargando(false))
  }, [yo, token])

  const materias = useMemo<MateriaOpcion[]>(
    () => comisiones.map((c) => ({ id_materia: c.materia.id_materia, nombre_materia: c.materia.nombre_materia })),
    [comisiones],
  )

  const getEventos = useCallback(
    (idMateria: number): EventoOpcion[] => {
      const comision = comisiones.find((c) => c.materia.id_materia === idMateria)
      return (comision?.eventos ?? []) as EventoOpcion[]
    },
    [comisiones],
  )

  const moverTarea = useCallback((idTarea: string, nuevoEstado: EstadoTarea) => {
    setTareas((prev) =>
      prev.map((t) => (t.id_tarea === idTarea ? { ...t, estado: nuevoEstado } : t)),
    )
    tareaServicio.actualizarEstado(idTarea, nuevoEstado, token ?? undefined)
  }, [token])

  const eliminarTarea = useCallback((idTarea: string) => {
    setTareas((prev) => prev.filter((t) => t.id_tarea !== idTarea))
    tareaServicio.eliminar(idTarea, token ?? undefined)
  }, [token])

  const agregarTarea = useCallback((estado: EstadoTarea, datos: DatosTarea) => {
    tareaServicio.crear({ ...datos, estado }, token ?? undefined)
      .then((nueva) => setTareas((prev) => [...prev, nueva]))
  }, [token])

  function handleDrop(estado: EstadoTarea) {
    if (tareaArrastrada) moverTarea(tareaArrastrada, estado)
    setTareaArrastrada(null)
    setColumnaActiva(null)
  }

  return {
    tareas,
    cargando,
    tareaArrastrada,
    columnaActiva,
    materias,
    getEventos,
    setTareaArrastrada,
    setColumnaActiva,
    eliminarTarea,
    agregarTarea,
    handleDrop,
  }
}

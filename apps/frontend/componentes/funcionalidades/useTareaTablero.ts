import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '@/src/context/AuthContext'
import { tareaServicio } from '@/servicios/tareaServicio'
import type { EstadoTarea, PrioridadTarea, TareaTablero } from '@/tipos'

export function useTareaTablero() {
  const { yo, token } = useAuth()
  const [tareas, setTareas] = useState<TareaTablero[]>([])
  const [tareaArrastrada, setTareaArrastrada] = useState<string | null>(null)
  const [columnaActiva, setColumnaActiva] = useState<EstadoTarea | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (!yo) {
      setTareas([])
      setCargando(false)
      return
    }
    setCargando(true)
    tareaServicio.obtenerPorUsuario(yo.id_usuario, token ?? undefined)
      .then(setTareas)
      .catch(() => setTareas([]))
      .finally(() => setCargando(false))
  }, [yo, token])

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

  const agregarTarea = useCallback((
    estado: EstadoTarea,
    datos: { titulo: string; prioridad: PrioridadTarea; descripcion?: string },
  ) => {
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
    setTareaArrastrada,
    setColumnaActiva,
    eliminarTarea,
    agregarTarea,
    handleDrop,
  }
}

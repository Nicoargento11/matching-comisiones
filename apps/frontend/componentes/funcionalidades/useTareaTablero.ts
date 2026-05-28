import { useState, useCallback } from 'react'
import type { EstadoTarea, TareaTablero } from '@/tipos'

// TODO: cuando el backend esté listo, agregar a los imports:
// import { useEffect } from 'react'
// import { useAuth } from '@/src/context/AuthContext'
// import { tareaServicio } from '@/servicios/tareaServicio'

// ─── MOCK — eliminar este bloque cuando el backend implemente los endpoints ───
const TAREAS_INICIALES: TareaTablero[] = [
  { id_tarea: '1', titulo: 'Leer apuntes de Análisis', prioridad: 'ALTA', estado: 'POR_HACER' },
  { id_tarea: '2', titulo: 'Entregar TP de Algoritmos', prioridad: 'ALTA', estado: 'POR_HACER', descripcion: 'Fecha límite: viernes 30/05' },
  { id_tarea: '3', titulo: 'Estudiar para parcial de Física', prioridad: 'MEDIA', estado: 'EN_PROGRESO' },
  { id_tarea: '4', titulo: 'Resolver guía de ejercicios', prioridad: 'BAJA', estado: 'EN_PROGRESO' },
  { id_tarea: '5', titulo: 'Inscripción a materias completada', prioridad: 'MEDIA', estado: 'COMPLETADO' },
]
// ─── fin mock ─────────────────────────────────────────────────────────────────

export function useTareaTablero() {
  const [tareas, setTareas] = useState<TareaTablero[]>(TAREAS_INICIALES)
  const [tareaArrastrada, setTareaArrastrada] = useState<string | null>(null)
  const [columnaActiva, setColumnaActiva] = useState<EstadoTarea | null>(null)
  const [cargando, setCargando] = useState(false)

  // TODO: cuando el backend esté listo, reemplazar las 2 líneas de arriba (useState iniciales)
  // y agregar este bloque:
  // const { yo, token } = useAuth()
  // useEffect(() => {
  //   if (!yo) return
  //   setCargando(true)
  //   tareaServicio.obtenerPorUsuario(yo.id_usuario, token ?? undefined)
  //     .then(setTareas)
  //     .catch(() => setTareas([]))
  //     .finally(() => setCargando(false))
  // }, [yo, token])

  const moverTarea = useCallback((idTarea: string, nuevoEstado: EstadoTarea) => {
    setTareas((prev) =>
      prev.map((t) => (t.id_tarea === idTarea ? { ...t, estado: nuevoEstado } : t)),
    )
    // TODO: cuando el backend esté listo, descomentar:
    // tareaServicio.actualizarEstado(idTarea, nuevoEstado, token ?? undefined)
  }, [])

  const eliminarTarea = useCallback((idTarea: string) => {
    setTareas((prev) => prev.filter((t) => t.id_tarea !== idTarea))
    // TODO: cuando el backend esté listo, descomentar:
    // tareaServicio.eliminar(idTarea, token ?? undefined)
  }, [])

  const agregarTarea = useCallback((estado: EstadoTarea, titulo: string) => {
    // TODO: cuando el backend esté listo, reemplazar todo el cuerpo por:
    // tareaServicio.crear({ titulo, estado, prioridad: 'MEDIA' }, token ?? undefined)
    //   .then((nueva) => setTareas((prev) => [...prev, nueva]))
    const nueva: TareaTablero = {
      id_tarea: Date.now().toString(), // ID temporal — el backend generará el real
      titulo,
      prioridad: 'MEDIA',
      estado,
    }
    setTareas((prev) => [...prev, nueva])
  }, [])

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

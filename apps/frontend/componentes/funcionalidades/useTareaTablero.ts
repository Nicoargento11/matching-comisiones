import { useState, useCallback, useEffect, useMemo } from 'react'
import { useAuth } from '@/src/context/AuthContext'
import { tareaServicio } from '@/servicios/tareaServicio'
import { columnaServicio } from '@/servicios/columnaServicio'
import { usuarioServicio } from '@/servicios/usuarioServicio'
import type { ColumnaKanban, Comision, DatosTarea, Evento, TareaTablero } from '@/tipos'

export type MateriaOpcion = { id_materia: number; nombre_materia: string }
export type EventoOpcion = Pick<Evento, 'id_evento' | 'titulo' | 'tipo_evento' | 'fecha_inicio'>

export function useTareaTablero() {
  const { yo, token } = useAuth()
  const [tareas, setTareas] = useState<TareaTablero[]>([])
  const [columnas, setColumnas] = useState<ColumnaKanban[]>([])
  const [comisiones, setComisiones] = useState<Comision[]>([])
  const [tareaArrastrada, setTareaArrastrada] = useState<string | null>(null)
  const [columnaActiva, setColumnaActiva] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)
  const [procesandoColumna, setProcesandoColumna] = useState(false)
  const [errorColumna, setErrorColumna] = useState('')

  useEffect(() => {
    if (!yo) {
      setTareas([])
      setColumnas([])
      setComisiones([])
      setCargando(false)
      return
    }
    setCargando(true)
    Promise.all([
      tareaServicio.obtenerPorUsuario(yo.id_usuario, token ?? undefined),
      columnaServicio.obtener(token ?? undefined),
      usuarioServicio.obtenerComisiones(yo.id_usuario, token ?? undefined),
    ])
      .then(([tareasData, columnasData, comisionesData]) => {
        setTareas(tareasData)
        setColumnas(columnasData)
        setComisiones(comisionesData)
      })
      .catch(() => {
        setTareas([])
        setColumnas([])
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

  const moverTarea = useCallback((idTarea: string, identificador: string) => {
    setTareas((prev) =>
      prev.map((t) => (t.id_tarea === idTarea ? { ...t, estado: identificador } : t)),
    )
    tareaServicio.actualizarEstado(idTarea, identificador, token ?? undefined)
  }, [token])

  const eliminarTarea = useCallback((idTarea: string) => {
    setTareas((prev) => prev.filter((t) => t.id_tarea !== idTarea))
    tareaServicio.eliminar(idTarea, token ?? undefined)
  }, [token])

  const agregarTarea = useCallback((identificador: string, datos: DatosTarea) => {
    tareaServicio.crear({ ...datos, estado: identificador }, token ?? undefined)
      .then((nueva) => setTareas((prev) => [...prev, nueva]))
      .catch((e) => setErrorColumna(e instanceof Error ? e.message : 'No se pudo crear la tarea'))
  }, [token])

  const agregarColumna = useCallback(async (nombre: string): Promise<boolean> => {
    setProcesandoColumna(true)
    setErrorColumna('')
    try {
      const nueva = await columnaServicio.crear(nombre, token ?? undefined)
      setColumnas((prev) => [...prev, nueva])
      return true
    } catch (e) {
      setErrorColumna(e instanceof Error ? e.message : 'No se pudo crear la columna')
      return false
    } finally {
      setProcesandoColumna(false)
    }
  }, [token])

  const eliminarColumna = useCallback(async (idColumna: number): Promise<boolean> => {
    setProcesandoColumna(true)
    setErrorColumna('')
    try {
      await columnaServicio.eliminar(idColumna, token ?? undefined)
      setColumnas((prev) => prev.filter((c) => c.id_columna !== idColumna))
      return true
    } catch (e) {
      setErrorColumna(e instanceof Error ? e.message : 'No se pudo eliminar la columna. Asegurate de que no tenga tareas.')
      return false
    } finally {
      setProcesandoColumna(false)
    }
  }, [token])

  function handleDrop(identificador: string) {
    if (tareaArrastrada) moverTarea(tareaArrastrada, identificador)
    setTareaArrastrada(null)
    setColumnaActiva(null)
  }

  return {
    tareas,
    columnas,
    cargando,
    procesandoColumna,
    errorColumna,
    tareaArrastrada,
    columnaActiva,
    materias,
    getEventos,
    setTareaArrastrada,
    setColumnaActiva,
    setErrorColumna,
    eliminarTarea,
    agregarTarea,
    agregarColumna,
    eliminarColumna,
    handleDrop,
  }
}

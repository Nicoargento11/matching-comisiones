'use client'

import { useState } from 'react'
import type { EstadoTarea, TareaTablero } from '@/tipos'
import ColumnaTablero from '@/componentes/interfaz/ColumnaTablero'

const ESTADOS: EstadoTarea[] = ['POR_HACER', 'EN_PROGRESO', 'COMPLETADO']

// TODO: reemplazar por llamada al backend cuando el endpoint esté listo
const TAREAS_INICIALES: TareaTablero[] = [
  { id_tarea: '1', titulo: 'Leer apuntes de Análisis', prioridad: 'ALTA', estado: 'POR_HACER' },
  { id_tarea: '2', titulo: 'Entregar TP de Algoritmos', prioridad: 'ALTA', estado: 'POR_HACER', descripcion: 'Fecha límite: viernes 30/05' },
  { id_tarea: '3', titulo: 'Estudiar para parcial de Física', prioridad: 'MEDIA', estado: 'EN_PROGRESO' },
  { id_tarea: '4', titulo: 'Resolver guía de ejercicios', prioridad: 'BAJA', estado: 'EN_PROGRESO' },
  { id_tarea: '5', titulo: 'Inscripción a materias completada', prioridad: 'MEDIA', estado: 'COMPLETADO' },
]

export default function TableroKanban() {
  const [tareas, setTareas] = useState<TareaTablero[]>(TAREAS_INICIALES)
  const [tareaArrastrada, setTareaArrastrada] = useState<string | null>(null)
  const [columnaActiva, setColumnaActiva] = useState<EstadoTarea | null>(null)

  function moverTarea(idTarea: string, nuevoEstado: EstadoTarea) {
    setTareas((prev) =>
      prev.map((t) => (t.id_tarea === idTarea ? { ...t, estado: nuevoEstado } : t)),
    )
  }

  function eliminarTarea(idTarea: string) {
    setTareas((prev) => prev.filter((t) => t.id_tarea !== idTarea))
  }

  function agregarTarea(estado: EstadoTarea, titulo: string) {
    const nueva: TareaTablero = {
      id_tarea: Date.now().toString(),
      titulo,
      prioridad: 'MEDIA',
      estado,
    }
    setTareas((prev) => [...prev, nueva])
  }

  function handleDrop(estado: EstadoTarea) {
    if (tareaArrastrada) moverTarea(tareaArrastrada, estado)
    setTareaArrastrada(null)
    setColumnaActiva(null)
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {ESTADOS.map((estado) => (
        <ColumnaTablero
          key={estado}
          estado={estado}
          tareas={tareas.filter((t) => t.estado === estado)}
          sobreLaColumna={columnaActiva === estado}
          onDragOver={(e) => { e.preventDefault(); setColumnaActiva(estado) }}
          onDrop={() => handleDrop(estado)}
          onDragLeave={() => setColumnaActiva(null)}
          onDragStartTarea={setTareaArrastrada}
          onEliminarTarea={eliminarTarea}
          onAgregarTarea={agregarTarea}
        />
      ))}
    </div>
  )
}

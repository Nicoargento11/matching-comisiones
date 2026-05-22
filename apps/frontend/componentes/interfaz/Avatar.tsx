import { colorPorMateria } from '@/lib/colores'

const TAMAÑOS = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
}

export default function Avatar({
  id,
  nombre,
  apellido,
  size = 'md',
}: {
  id: number
  nombre: string
  apellido: string
  size?: 'sm' | 'md' | 'lg'
}) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${TAMAÑOS[size]}`}
      style={{ backgroundColor: colorPorMateria(id) }}
    >
      {nombre[0]}{apellido[0]}
    </div>
  )
}

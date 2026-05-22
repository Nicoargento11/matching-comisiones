export default function RolBadge({ rol }: { rol: string }) {
  const esProfe = rol === 'Profe'
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide ${
        esProfe
          ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300'
          : 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300'
      }`}
    >
      {esProfe ? 'Profesor' : 'Alumno'}
    </span>
  )
}

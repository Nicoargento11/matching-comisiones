// pie de pagina del sistema SIC
export default function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm text-gray-400 dark:text-gray-500">
          SIC &mdash; Sistema de Intercambio de Comisiones &copy; {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  )
}

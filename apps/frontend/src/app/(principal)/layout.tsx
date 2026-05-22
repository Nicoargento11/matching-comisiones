import Navbar from '@/componentes/estructura/Navbar'
import Footer from '@/componentes/estructura/Footer'
import { Providers } from './providers'

export default function LayoutPrincipal({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Providers>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
        <Footer />
      </div>
    </Providers>
  )
}

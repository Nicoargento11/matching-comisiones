'use client'

import { AuthProvider } from '@/src/context/AuthContext'
import { NotificacionesProvider } from '@/src/context/NotificacionesContext'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <NotificacionesProvider>
        {children}
      </NotificacionesProvider>
    </AuthProvider>
  )
}

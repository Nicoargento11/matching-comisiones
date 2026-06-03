'use client'

import { AuthProvider } from '@/src/context/AuthContext'
import { NotificacionesProvider } from '@/src/context/NotificacionesContext'
import { MensajesNoLeidosProvider } from '@/src/context/MensajesNoLeidosContext'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <NotificacionesProvider>
        <MensajesNoLeidosProvider>
          {children}
        </MensajesNoLeidosProvider>
      </NotificacionesProvider>
    </AuthProvider>
  )
}

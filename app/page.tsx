"use client"

import { useAuth } from "@/contexts/auth-context"
import Dashboard from "@/components/dashboard/dashboard"
import LandingPage from "@/components/landing/landing-page"
import { Loader2 } from "lucide-react"
import { modernTheme } from "@/lib/theme"

export default function Home() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className={`min-h-screen w-full ${modernTheme.colors.bg} flex items-center justify-center`}>
        <div className="text-center">
          <Loader2 className={`h-12 w-12 animate-spin ${modernTheme.colors.primaryText} mx-auto mb-4`} />
          <p className={`${modernTheme.colors.primaryText} text-lg`}>Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LandingPage />
  }

  // Si hay usuario, el Dashboard se encargará de toda la lógica de suscripción
  return <Dashboard />
}

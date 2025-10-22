"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useTeamContext } from "@/contexts/team-context"
import TeamSettings from "@/components/teams/team-settings"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function TeamSettingsPage() {
  const { user, subscriptionStatus } = useAuth()
  const { isPersonalMode, currentTeam, loading } = useTeamContext()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.replace("/auth")
      return
    }
    if (!subscriptionStatus.canAccessDashboard) {
      router.replace("/subscription")
    }
  }, [user, subscriptionStatus, router])

  if (!user || !subscriptionStatus.canAccessDashboard) {
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen gtd-gradient-bg flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen gtd-gradient-bg">
      <header className="glassmorphism border-b border-white/20 sticky top-0 z-10">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex items-center h-16 gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Volver
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">
                {currentTeam ? `Configuración: ${currentTeam.name}` : "Configuración de Equipo"}
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
        <TeamSettings />
      </main>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, Users, CreditCard } from "lucide-react"
import { useTeamContext } from "@/contexts/team-context"
import { useRouter } from "next/navigation"
import TeamGeneralSettings from "./team-general-settings"
import TeamMembersList from "./team-members-list"
import TeamSubscriptionCard from "./team-subscription-card"

export default function TeamSettings() {
  const { currentTeam, currentUserRole, isPersonalMode, switchToPersonal } = useTeamContext()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("general")

  // Si no hay equipo seleccionado o estamos en modo personal, redirigir
  if (isPersonalMode || !currentTeam) {
    return (
      <div className="glassmorphism p-8 rounded-lg text-center">
        <h2 className="text-xl font-semibold mb-2">Sin equipo seleccionado</h2>
        <p className="text-muted-foreground mb-4">
          Selecciona un equipo desde el menú superior para ver su configuración
        </p>
      </div>
    )
  }

  const handleTeamDeleted = () => {
    // Cuando se elimina el equipo, volver a modo Personal y redirigir al dashboard
    switchToPersonal()
    router.push("/dashboard")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Configuración del Equipo</h1>
        <p className="text-muted-foreground">
          Gestiona la configuración, miembros y suscripción de {currentTeam.name}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="glassmorphism">
          <TabsTrigger value="general" className="gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-2">
            <Users className="h-4 w-4" />
            Miembros
          </TabsTrigger>
          <TabsTrigger value="subscription" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Suscripción
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <div className="glassmorphism p-6 rounded-lg">
            <TeamGeneralSettings
              team={currentTeam}
              userRole={currentUserRole}
              onTeamDeleted={handleTeamDeleted}
            />
          </div>
        </TabsContent>

        <TabsContent value="members" className="space-y-6">
          <div className="glassmorphism p-6 rounded-lg">
            <TeamMembersList teamId={currentTeam.id} userRole={currentUserRole} />
          </div>
        </TabsContent>

        <TabsContent value="subscription" className="space-y-6">
          <TeamSubscriptionCard teamId={currentTeam.id} userRole={currentUserRole} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

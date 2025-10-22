"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Users, User, Plus, ChevronDown, Settings } from "lucide-react"
import { useTeamContext } from "@/contexts/team-context"
import { useRouter } from "next/navigation"
import CreateTeamDialog from "./create-team-dialog"
import type { TeamRole } from "@/types/task"

const translateRole = (role: TeamRole | null) => {
  switch (role) {
    case "owner":
      return "Propietario"
    case "admin":
      return "Administrador"
    case "member":
      return "Miembro"
    default:
      return ""
  }
}

const getRoleBadgeVariant = (role: TeamRole | null) => {
  switch (role) {
    case "owner":
      return "default"
    case "admin":
      return "secondary"
    case "member":
      return "outline"
    default:
      return "outline"
  }
}

export default function TeamSwitcher() {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const { selectedTeamId, isPersonalMode, currentTeam, teams, switchToPersonal, switchToTeam, loading } =
    useTeamContext()
  const router = useRouter()

  if (loading) {
    return (
      <Button variant="ghost" className="glassmorphism" disabled>
        <User className="h-4 w-4 mr-2" />
        Cargando...
      </Button>
    )
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="glassmorphism">
            {isPersonalMode ? (
              <>
                <User className="h-4 w-4 mr-2" />
                Personal
              </>
            ) : (
              <>
                <Users className="h-4 w-4 mr-2" />
                {currentTeam?.name || "Equipo"}
              </>
            )}
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-64 glassmorphism">
          {/* Opción Personal */}
          <DropdownMenuItem onClick={switchToPersonal} className={isPersonalMode ? "bg-accent" : ""}>
            <User className="h-4 w-4 mr-2" />
            Personal
            {isPersonalMode && <Badge className="ml-auto">Actual</Badge>}
          </DropdownMenuItem>

          {/* Separator si hay equipos */}
          {teams.length > 0 && <DropdownMenuSeparator />}

          {/* Equipos */}
          {teams.length > 0 && <DropdownMenuLabel>Mis Equipos</DropdownMenuLabel>}

          {teams.map((team) => (
            <DropdownMenuItem
              key={team.id}
              onClick={() => switchToTeam(team.id)}
              className={selectedTeamId === team.id ? "bg-accent" : ""}
            >
              <Users className="h-4 w-4 mr-2" />
              <div className="flex flex-col flex-1">
                <span>{team.name}</span>
                {team.userRole && (
                  <span className="text-xs text-muted-foreground">{translateRole(team.userRole)}</span>
                )}
              </div>
              {selectedTeamId === team.id && <Badge className="ml-2">Actual</Badge>}
            </DropdownMenuItem>
          ))}

          {/* Configuración del equipo actual (solo si hay un equipo seleccionado) */}
          {!isPersonalMode && currentTeam && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/teams/settings")}>
                <Settings className="h-4 w-4 mr-2" />
                Configuración del Equipo
              </DropdownMenuItem>
            </>
          )}

          {/* Crear equipo */}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Crear Equipo
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateTeamDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
    </>
  )
}

"use client"

import { useState, useEffect } from "react"
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
import { Bell, Check, X, Users, Loader2 } from "lucide-react"
import { useTeamInvitations } from "@/hooks/use-team-invitations"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

export default function UserInvitationsBadge() {
  const [open, setOpen] = useState(false)
  const { userInvitations, loading, fetchUserInvitations, acceptInvitation, rejectInvitation } =
    useTeamInvitations({ autoFetchUserInvitations: false })
  const { toast } = useToast()
  const [processingId, setProcessingId] = useState<string | null>(null)

  // Cargar invitaciones cuando se abre el dropdown
  useEffect(() => {
    if (open) {
      fetchUserInvitations()
    }
  }, [open, fetchUserInvitations])

  const handleAccept = async (invitationId: string, teamName?: string) => {
    setProcessingId(invitationId)
    try {
      await acceptInvitation(invitationId)
      toast({
        title: "Invitación aceptada",
        description: teamName ? `Te has unido al equipo "${teamName}"` : "Te has unido al equipo",
      })
      fetchUserInvitations() // Recargar lista
    } catch (error: any) {
      console.error("Error al aceptar invitación:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo aceptar la invitación",
        variant: "destructive",
      })
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (invitationId: string, teamName?: string) => {
    setProcessingId(invitationId)
    try {
      await rejectInvitation(invitationId)
      toast({
        title: "Invitación rechazada",
        description: teamName ? `Has rechazado la invitación de "${teamName}"` : "Has rechazado la invitación",
      })
      fetchUserInvitations() // Recargar lista
    } catch (error: any) {
      console.error("Error al rechazar invitación:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo rechazar la invitación",
        variant: "destructive",
      })
    } finally {
      setProcessingId(null)
    }
  }

  const pendingCount = userInvitations.filter((inv) => inv.status === "pending").length

  if (pendingCount === 0 && !open) {
    // No mostrar el badge si no hay invitaciones pendientes
    return null
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="glassmorphism relative" size="icon">
          <Bell className="h-4 w-4" />
          {pendingCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {pendingCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 glassmorphism">
        <DropdownMenuLabel>Invitaciones Pendientes</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : userInvitations.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No tienes invitaciones pendientes
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {userInvitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex flex-col gap-2 border-b border-border/40 p-3 last:border-0"
              >
                <div className="flex items-start gap-2">
                  <Users className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{invitation.teamName || "Equipo"}</p>
                    <p className="text-xs text-muted-foreground">
                      Rol: {invitation.role === "admin" ? "Administrador" : "Miembro"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(invitation.createdAt, { addSuffix: true, locale: es })}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    className="flex-1"
                    onClick={() => handleAccept(invitation.id, invitation.teamName)}
                    disabled={processingId === invitation.id}
                  >
                    {processingId === invitation.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <>
                        <Check className="h-3 w-3 mr-1" />
                        Aceptar
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleReject(invitation.id, invitation.teamName)}
                    disabled={processingId === invitation.id}
                  >
                    {processingId === invitation.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <>
                        <X className="h-3 w-3 mr-1" />
                        Rechazar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

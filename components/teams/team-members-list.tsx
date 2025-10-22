"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTeamMembers } from "@/hooks/use-team-members"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { MoreVertical, Shield, User, UserMinus, Crown, Loader2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import type { TeamMember, TeamRole } from "@/types/task"
import InviteMemberDialog from "./invite-member-dialog"

interface TeamMembersListProps {
  teamId: string
  userRole: TeamRole | null
}

export default function TeamMembersList({ teamId, userRole }: TeamMembersListProps) {
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null)
  const [memberToChangeRole, setMemberToChangeRole] = useState<TeamMember | null>(null)
  const [newRole, setNewRole] = useState<TeamRole | null>(null)
  const [processing, setProcessing] = useState(false)

  const { members, loading, removeMember, updateMemberRole, currentUserRole } = useTeamMembers(teamId)
  const { user } = useAuth()
  const { toast } = useToast()

  const canManageMembers = userRole === "owner" || userRole === "admin"
  const isOwner = userRole === "owner"

  const handleRemoveMember = async () => {
    if (!memberToRemove || !canManageMembers) return

    setProcessing(true)
    try {
      await removeMember(memberToRemove.userId)

      toast({
        title: "Miembro eliminado",
        description: `${memberToRemove.displayName || memberToRemove.email} ha sido eliminado del equipo`,
      })

      setMemberToRemove(null)
    } catch (error: any) {
      console.error("Error al eliminar miembro:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el miembro",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleChangeRole = async () => {
    if (!memberToChangeRole || !newRole || !canManageMembers) return

    setProcessing(true)
    try {
      await updateMemberRole(memberToChangeRole.userId, newRole)

      toast({
        title: "Rol actualizado",
        description: `${memberToChangeRole.displayName || memberToChangeRole.email} ahora es ${
          newRole === "admin" ? "Administrador" : "Miembro"
        }`,
      })

      setMemberToChangeRole(null)
      setNewRole(null)
    } catch (error: any) {
      console.error("Error al cambiar rol:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo cambiar el rol",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  const getRoleBadgeVariant = (role: TeamRole) => {
    switch (role) {
      case "owner":
        return "default"
      case "admin":
        return "secondary"
      case "member":
        return "outline"
    }
  }

  const getRoleIcon = (role: TeamRole) => {
    switch (role) {
      case "owner":
        return <Crown className="h-3 w-3" />
      case "admin":
        return <Shield className="h-3 w-3" />
      case "member":
        return <User className="h-3 w-3" />
    }
  }

  const getRoleText = (role: TeamRole) => {
    switch (role) {
      case "owner":
        return "Propietario"
      case "admin":
        return "Administrador"
      case "member":
        return "Miembro"
    }
  }

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    }
    if (email) {
      return email.slice(0, 2).toUpperCase()
    }
    return "?"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Miembros del Equipo ({members.length})</h3>
        {canManageMembers && (
          <Button onClick={() => setShowInviteDialog(true)}>Invitar Miembro</Button>
        )}
      </div>

      <div className="space-y-2">
        {members.map((member) => {
          const isCurrentUser = member.userId === user?.uid
          const canManageThisMember =
            canManageMembers && !isCurrentUser && (isOwner || member.role !== "owner")

          return (
            <div
              key={member.id}
              className="glassmorphism flex items-center justify-between p-4 rounded-lg"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage src={member.photoURL || undefined} alt={member.displayName || member.email} />
                  <AvatarFallback className="glassmorphism">
                    {getInitials(member.displayName, member.email)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">
                      {member.displayName || member.email}
                      {isCurrentUser && <span className="text-muted-foreground ml-1">(tú)</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={getRoleBadgeVariant(member.role)} className="text-xs">
                      {getRoleIcon(member.role)}
                      <span className="ml-1">{getRoleText(member.role)}</span>
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Se unió{" "}
                      {formatDistanceToNow(member.joinedAt, { addSuffix: true, locale: es })}
                    </span>
                  </div>
                </div>
              </div>

              {canManageThisMember && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="flex-shrink-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="glassmorphism">
                    {isOwner && member.role !== "admin" && (
                      <DropdownMenuItem
                        onClick={() => {
                          setMemberToChangeRole(member)
                          setNewRole("admin")
                        }}
                      >
                        <Shield className="mr-2 h-4 w-4" />
                        Hacer Administrador
                      </DropdownMenuItem>
                    )}
                    {isOwner && member.role === "admin" && (
                      <DropdownMenuItem
                        onClick={() => {
                          setMemberToChangeRole(member)
                          setNewRole("member")
                        }}
                      >
                        <User className="mr-2 h-4 w-4" />
                        Hacer Miembro
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => setMemberToRemove(member)}
                      className="text-destructive focus:text-destructive"
                    >
                      <UserMinus className="mr-2 h-4 w-4" />
                      Eliminar del equipo
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )
        })}
      </div>

      {/* Dialog para invitar miembro */}
      <InviteMemberDialog
        teamId={teamId}
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
      />

      {/* Dialog de confirmación para eliminar miembro */}
      <AlertDialog open={!!memberToRemove} onOpenChange={(open) => !open && setMemberToRemove(null)}>
        <AlertDialogContent className="glassmorphism">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar miembro?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres eliminar a{" "}
              <strong>{memberToRemove?.displayName || memberToRemove?.email}</strong> del equipo? Esta
              acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveMember} disabled={processing} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmación para cambiar rol */}
      <AlertDialog
        open={!!memberToChangeRole}
        onOpenChange={(open) => !open && (setMemberToChangeRole(null), setNewRole(null))}
      >
        <AlertDialogContent className="glassmorphism">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cambiar rol?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres cambiar el rol de{" "}
              <strong>{memberToChangeRole?.displayName || memberToChangeRole?.email}</strong> a{" "}
              <strong>{newRole === "admin" ? "Administrador" : "Miembro"}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleChangeRole} disabled={processing}>
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cambiando...
                </>
              ) : (
                "Cambiar Rol"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

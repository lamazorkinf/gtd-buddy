"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTeamInvitations } from "@/hooks/use-team-invitations"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Mail } from "lucide-react"
import type { TeamRole } from "@/types/task"

interface InviteMemberDialogProps {
  teamId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function InviteMemberDialog({ teamId, open, onOpenChange }: InviteMemberDialogProps) {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<TeamRole>("member")
  const [sending, setSending] = useState(false)

  const { createInvitation } = useTeamInvitations({ watchTeamId: teamId })
  const { toast } = useToast()

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim()) {
      toast({
        title: "Error",
        description: "El email es requerido",
        variant: "destructive",
      })
      return
    }

    if (!validateEmail(email.trim())) {
      toast({
        title: "Error",
        description: "El email no es válido",
        variant: "destructive",
      })
      return
    }

    setSending(true)

    try {
      await createInvitation(email.trim().toLowerCase(), role)

      toast({
        title: "Invitación enviada",
        description: `Se ha enviado una invitación a ${email}`,
      })

      // Limpiar y cerrar
      setEmail("")
      setRole("member")
      onOpenChange(false)
    } catch (error: any) {
      console.error("Error al enviar invitación:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar la invitación. Intenta de nuevo.",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  const handleCancel = () => {
    setEmail("")
    setRole("member")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glassmorphism sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Invitar Miembro</DialogTitle>
          <DialogDescription>
            Envía una invitación por email para que se una a tu equipo
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="nombre@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={sending}
                  className="glassmorphism pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Rol</Label>
              <Select value={role} onValueChange={(value) => setRole(value as TeamRole)} disabled={sending}>
                <SelectTrigger id="role" className="glassmorphism">
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent className="glassmorphism">
                  <SelectItem value="member">
                    <div className="flex flex-col">
                      <span className="font-medium">Miembro</span>
                      <span className="text-xs text-muted-foreground">Puede ver tareas del equipo</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex flex-col">
                      <span className="font-medium">Administrador</span>
                      <span className="text-xs text-muted-foreground">
                        Puede gestionar miembros y configuración
                      </span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Los miembros pueden ver las tareas del equipo. Los administradores pueden además gestionar
                miembros y configuración.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={sending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={sending || !email.trim()}>
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar Invitación"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

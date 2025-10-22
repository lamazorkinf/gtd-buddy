"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { useTeams } from "@/hooks/use-teams"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Save, Trash2 } from "lucide-react"
import type { Team } from "@/types/task"

interface TeamGeneralSettingsProps {
  team: Team
  userRole: "owner" | "admin" | "member" | null
  onTeamDeleted?: () => void
}

export default function TeamGeneralSettings({ team, userRole, onTeamDeleted }: TeamGeneralSettingsProps) {
  const [name, setName] = useState(team.name)
  const [description, setDescription] = useState(team.description || "")
  const [saving, setSaving] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const { updateTeam, deleteTeam } = useTeams()
  const { toast } = useToast()

  const canEdit = userRole === "owner" || userRole === "admin"
  const canDelete = userRole === "owner"

  const hasChanges = name !== team.name || description !== (team.description || "")

  const handleSave = async () => {
    if (!canEdit || !name.trim()) return

    setSaving(true)
    try {
      await updateTeam(team.id, {
        name: name.trim(),
        description: description.trim() || undefined,
      })

      toast({
        title: "Cambios guardados",
        description: "La información del equipo ha sido actualizada",
      })
    } catch (error: any) {
      console.error("Error al guardar cambios:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudieron guardar los cambios",
        variant: "destructive",
      })
      // Revertir cambios
      setName(team.name)
      setDescription(team.description || "")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!canDelete) return

    setDeleting(true)
    try {
      await deleteTeam(team.id)

      toast({
        title: "Equipo eliminado",
        description: `El equipo "${team.name}" ha sido eliminado`,
      })

      setShowDeleteDialog(false)
      onTeamDeleted?.()
    } catch (error: any) {
      console.error("Error al eliminar equipo:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el equipo",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Información General</h3>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="team-name">
              Nombre del equipo <span className="text-destructive">*</span>
            </Label>
            <Input
              id="team-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              disabled={!canEdit || saving}
              className="glassmorphism"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="team-description">Descripción</Label>
            <Textarea
              id="team-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={200}
              rows={3}
              disabled={!canEdit || saving}
              className="glassmorphism resize-none"
            />
            <p className="text-xs text-muted-foreground">{description.length}/200 caracteres</p>
          </div>

          {canEdit && (
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={!hasChanges || saving || !name.trim()}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar Cambios
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {canDelete && (
        <>
          <div className="border-t border-destructive/20 pt-6">
            <h3 className="text-lg font-medium mb-2 text-destructive">Zona de Peligro</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Eliminar el equipo es una acción permanente. Se eliminarán todas las tareas, contextos y miembros asociados.
            </p>
            <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar Equipo
            </Button>
          </div>

          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogContent className="glassmorphism">
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Se eliminará permanentemente el equipo{" "}
                  <strong>"{team.name}"</strong> junto con:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Todas las tareas del equipo</li>
                    <li>Todos los contextos del equipo</li>
                    <li>Todos los miembros e invitaciones</li>
                    <li>La suscripción asociada (si existe)</li>
                  </ul>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  {deleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Eliminando...
                    </>
                  ) : (
                    "Eliminar Permanentemente"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  )
}

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
import { Textarea } from "@/components/ui/textarea"
import { useTeams } from "@/hooks/use-teams"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface CreateTeamDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function CreateTeamDialog({ open, onOpenChange }: CreateTeamDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [creating, setCreating] = useState(false)
  const { createTeam } = useTeams()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast({
        title: "Error",
        description: "El nombre del equipo es requerido",
        variant: "destructive",
      })
      return
    }

    setCreating(true)

    try {
      await createTeam({
        name: name.trim(),
        description: description.trim() || undefined,
      })

      toast({
        title: "Equipo creado",
        description: `El equipo "${name}" ha sido creado con éxito. Tienes 7 días de prueba gratuita.`,
      })

      // Limpiar y cerrar
      setName("")
      setDescription("")
      onOpenChange(false)
    } catch (error: any) {
      console.error("Error al crear equipo:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el equipo. Intenta de nuevo.",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  const handleCancel = () => {
    setName("")
    setDescription("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glassmorphism sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Equipo</DialogTitle>
          <DialogDescription>
            Crea un equipo para colaborar en tareas. Obtendrás 7 días de prueba gratuita.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="team-name">
                Nombre del equipo <span className="text-destructive">*</span>
              </Label>
              <Input
                id="team-name"
                placeholder="Mi equipo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
                disabled={creating}
                className="glassmorphism"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="team-description">Descripción (opcional)</Label>
              <Textarea
                id="team-description"
                placeholder="Describe el propósito de este equipo..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={200}
                rows={3}
                disabled={creating}
                className="glassmorphism resize-none"
              />
              <p className="text-xs text-muted-foreground">{description.length}/200 caracteres</p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={creating}>
              Cancelar
            </Button>
            <Button type="submit" disabled={creating || !name.trim()}>
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                "Crear Equipo"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

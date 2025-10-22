"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Lightbulb } from "lucide-react"
import type { Context } from "@/types/task"
import { useContexts } from "@/hooks/use-contexts"
import { modernTheme } from "@/lib/theme"

interface ContextFormProps {
  context?: Context
  onClose?: () => void
}

const CONTEXT_STATUSES: { value: Context["status"]; label: string; color: string; emoji: string }[] = [
  { value: "active", label: "Activo", color: "text-green-700", emoji: "" },
  { value: "inactive", label: "Inactivo", color: "text-gray-700", emoji: "" },
]

export default function ContextForm({ context, onClose }: ContextFormProps) {
  const [name, setName] = useState(context?.name || "")
  const [description, setDescription] = useState(context?.description || "")
  const [status, setStatus] = useState<Context["status"]>(context?.status || "active")
  const [loading, setLoading] = useState(false)

  const { addContext, updateContext } = useContexts()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    try {
      const dataToSave: Partial<Context> = { name: name.trim(), description, status }

      if (context && context.id) {
        await updateContext(context.id, dataToSave)
      } else {
        await addContext(dataToSave as Omit<Context, "id" | "userId" | "createdAt">) // Cast as new context doesn't have id/userId/createdAt yet
      }

      if (!context) {
        // Reset form only if creating new
        setName("")
        setDescription("")
        setStatus("active")
      }
      onClose?.()
    } catch (error) {
      console.error("Error al guardar contexto:", error)
      // Consider adding user-facing error message here
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="context-name" className={`text-sm font-medium ${modernTheme.colors.primaryText} mb-1 block`}>
              Nombre del Contexto *
            </label>
            <Input
              id="context-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ej: Trabajo, Casa, Teléfono, Proyecto X"
              required
              className={`text-md ${modernTheme.container.radius}`}
            />
          </div>

          <div>
            <label htmlFor="context-description" className={`text-sm font-medium ${modernTheme.colors.primaryText} mb-1 block`}>
              Descripción
            </label>
            <Textarea
              id="context-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe el contexto, objetivos específicos, criterios de éxito..."
              rows={3}
              className={`text-md ${modernTheme.container.radius}`}
            />
          </div>

          <div>
            <label htmlFor="context-status" className={`text-sm font-medium ${modernTheme.colors.primaryText} mb-1 block`}>
              Estado
            </label>
            <Select value={status || "active"} onValueChange={(value) => setStatus(value as Context["status"])}>
              <SelectTrigger id="context-status" className={`${modernTheme.container.radius}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={`${modernTheme.container.radius}`}>
                {CONTEXT_STATUSES.map((statusOption) => (
                  <SelectItem key={statusOption.value} value={statusOption.value || "active"}>
                    <span className={statusOption.color}>
                      {statusOption.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className={`${modernTheme.colors.cardProject} p-4 ${modernTheme.container.radius} border ${modernTheme.colors.cardBorder}`}>
            <div className="flex items-start gap-3">
              <Lightbulb className={`h-5 w-5 ${modernTheme.colors.primaryText} mt-0.5 flex-shrink-0`} />
              <div>
                <p className={`text-sm ${modernTheme.colors.primaryText} ${modernTheme.typography.heading} mb-1`}>Tips para Contextos Efectivos:</p>
                <ul className={`text-sm ${modernTheme.colors.mutedForeground} space-y-1 list-disc list-inside`}>
                  <li>
                    Pueden ser lugares (@Oficina), herramientas (@Email), personas (@Jefe) o proyectos específicos.
                  </li>
                  <li>Úsalos para filtrar tareas según lo que PUEDES hacer ahora.</li>
                  <li>Revisa y actualiza tus contextos regularmente.</li>
                </ul>
              </div>
            </div>
          </div>

          <div className={`flex gap-3 pt-4 border-t ${modernTheme.colors.cardBorder}`}>
            <Button
              type="submit"
              disabled={loading || !name.trim()}
              className={`flex-1 ${modernTheme.colors.primary} ${modernTheme.colors.primaryHover} text-white ${modernTheme.container.radius} ${modernTheme.effects.transition}`}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Guardando..." : context ? "Actualizar Contexto" : "Crear Contexto"}
            </Button>
            {onClose && (
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className={`${modernTheme.container.radius} ${modernTheme.effects.transition}`}
              >
                Cancelar
              </Button>
            )}
          </div>
        </form>
  )
}

"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Edit, Target, Loader2 } from "lucide-react"
import type { Context } from "@/types/task"
import { useContexts } from "@/hooks/use-contexts"

interface ContextFormProps {
  context?: Context
  onClose?: () => void
}

const CONTEXT_STATUSES: { value: Context["status"]; label: string; color: string; emoji: string }[] = [
  { value: "active", label: "Activo", color: "text-gtd-confidence-700", emoji: "🟢" },
  { value: "inactive", label: "Inactivo", color: "text-gtd-neutral-700", emoji: "⚪" },
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
    <Card className="w-full max-w-2xl mx-auto bg-white/90 backdrop-blur-sm border border-gtd-neutral-100 shadow-xl">
      <CardHeader className="border-b border-gtd-neutral-100">
        <CardTitle className="flex items-center gap-3 font-heading text-xl text-gtd-clarity-700">
          {context ? (
            <Edit className="h-5 w-5 text-gtd-clarity-500" />
          ) : (
            <Plus className="h-5 w-5 text-gtd-clarity-500" />
          )}
          {context ? "Editar Contexto" : "Nuevo Contexto"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="context-name" className="text-sm font-medium text-gtd-neutral-700 mb-1 block">
              Nombre del Contexto *
            </label>
            <Input
              id="context-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ej: Trabajo, Casa, Teléfono, Proyecto X"
              required
              className="text-md border-gtd-neutral-300 focus:border-gtd-clarity-500 focus:ring-gtd-clarity-500"
            />
          </div>

          <div>
            <label htmlFor="context-description" className="text-sm font-medium text-gtd-neutral-700 mb-1 block">
              Descripción
            </label>
            <Textarea
              id="context-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe el contexto, objetivos específicos, criterios de éxito..."
              rows={3}
              className="text-md border-gtd-neutral-300 focus:border-gtd-clarity-500 focus:ring-gtd-clarity-500"
            />
          </div>

          <div>
            <label htmlFor="context-status" className="text-sm font-medium text-gtd-neutral-700 mb-1 block">
              Estado
            </label>
            <Select value={status || "active"} onValueChange={(value) => setStatus(value as Context["status"])}>
              <SelectTrigger id="context-status" className="border-gtd-neutral-300 text-gtd-neutral-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTEXT_STATUSES.map((statusOption) => (
                  <SelectItem key={statusOption.value} value={statusOption.value || "active"}>
                    <span className={statusOption.color}>
                      {statusOption.emoji} {statusOption.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="bg-gtd-clarity-50 p-4 rounded-lg border-l-4 border-gtd-clarity-400">
            <div className="flex items-start gap-3">
              <Target className="h-6 w-6 text-gtd-clarity-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-gtd-clarity-700 font-medium mb-1">💡 Tips para Contextos Efectivos:</p>
                <ul className="text-sm text-gtd-clarity-600 space-y-1 list-disc list-inside">
                  <li>
                    Pueden ser lugares (@Oficina), herramientas (@Email), personas (@Jefe) o proyectos específicos.
                  </li>
                  <li>Úsalos para filtrar tareas según lo que PUEDES hacer ahora.</li>
                  <li>Revisa y actualiza tus contextos regularmente.</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gtd-neutral-100">
            <Button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 bg-gradient-to-r from-gtd-clarity-500 to-gtd-action-500 hover:from-gtd-clarity-600 hover:to-gtd-action-600 text-white"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Guardando..." : context ? "Actualizar Contexto" : "Crear Contexto"}
            </Button>
            {onClose && (
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="border-gtd-neutral-300 text-gtd-neutral-700 hover:bg-gtd-neutral-100 bg-transparent"
              >
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

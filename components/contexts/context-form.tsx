"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Plus, Edit, Target } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { Context } from "@/types/task"
import { useContexts } from "@/hooks/use-contexts"

interface ContextFormProps {
  context?: Context
  onClose?: () => void
}

const CONTEXT_STATUSES = [
  { value: "active", label: "🎯 Activo", color: "text-green-600" },
  { value: "on_hold", label: "⏸️ En Pausa", color: "text-yellow-600" },
  { value: "completed", label: "✅ Completado", color: "text-blue-600" },
  { value: "someday", label: "🌱 Algún Día", color: "text-gray-600" },
] as const

export default function ContextForm({ context, onClose }: ContextFormProps) {
  const [name, setName] = useState(context?.name || "")
  const [description, setDescription] = useState(context?.description || "")
  const [status, setStatus] = useState<Context["status"]>(context?.status || "active")
  const [targetDate, setTargetDate] = useState<Date | undefined>(context?.targetDate)
  const [loading, setLoading] = useState(false)

  const { addContext, updateContext } = useContexts()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    try {
      if (context && context.id) {
        await updateContext(context.id, {
          name,
          description,
          status,
          targetDate,
        })
      } else {
        await addContext({
          name,
          description,
          status,
          targetDate,
        })
      }

      // Reset form if creating new context
      if (!context) {
        setName("")
        setDescription("")
        setStatus("active")
        setTargetDate(undefined)
      }

      onClose?.()
    } catch (error) {
      console.error("Error al guardar contexto:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-heading">
          {context ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
          {context ? "Editar Contexto" : "Nuevo Contexto"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Nombre del Contexto *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ej: Trabajo, Casa, Teléfono, Proyecto X"
              required
              className="text-lg"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Descripción</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe el contexto, objetivos específicos, criterios de éxito..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Estado del Contexto</label>
              <Select value={status || "active"} onValueChange={(value: Context["status"]) => setStatus(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTEXT_STATUSES.map((statusOption) => (
                    <SelectItem key={statusOption.value} value={statusOption.value}>
                      <span className={statusOption.color}>{statusOption.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Fecha Objetivo (opcional)</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {targetDate ? format(targetDate, "PPP", { locale: es }) : "Seleccionar fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={targetDate} onSelect={setTargetDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Tips para contextos */}
          <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-400">
            <div className="flex items-start gap-2">
              <Target className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <p className="text-sm text-purple-700 font-medium mb-1">💡 Tips para Contextos:</p>
                <ul className="text-sm text-purple-600 space-y-1">
                  <li>• Los contextos pueden ser lugares, personas, herramientas o proyectos</li>
                  <li>• Usa contextos para agrupar tareas relacionadas</li>
                  <li>• Revisa tus contextos regularmente</li>
                  <li>• Mantén tus contextos simples y relevantes</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {loading ? "Guardando..." : context ? "Actualizar Contexto" : "Crear Contexto"}
            </Button>
            {onClose && (
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

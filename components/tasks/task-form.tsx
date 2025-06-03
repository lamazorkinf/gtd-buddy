"use client"

import type React from "react"
import type { EnergyLevel } from "@/types/task" // Import EnergyLevel

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Plus, Edit, Clock } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { Task, GTDCategory, Priority } from "@/types/task"
import { useTasks } from "@/hooks/use-tasks"
import { useContexts } from "@/hooks/use-contexts"

interface TaskFormProps {
  task?: Task
  onClose?: () => void
  defaultCategory?: GTDCategory
  defaultDueDate?: Date
  defaultContextId?: string
}

const GTD_CATEGORIES: GTDCategory[] = ["Inbox", "Próximas acciones", "Multitarea", "A la espera", "Algún día"]

const PRIORITIES: Priority[] = ["baja", "media", "alta"]
const ENERGY_LEVELS: EnergyLevel[] = ["baja", "media", "alta"]

const PRIORITY_COLORS = {
  baja: "text-green-600 bg-green-100",
  media: "text-yellow-600 bg-yellow-100",
  alta: "text-red-600 bg-red-100",
}

export default function TaskForm({ task, onClose, defaultCategory, defaultDueDate, defaultContextId }: TaskFormProps) {
  const [title, setTitle] = useState(task?.title || "")
  const [description, setDescription] = useState(task?.description || "")
  const [category, setCategory] = useState<GTDCategory>(task?.category || defaultCategory || "Inbox")
  const [priority, setPriority] = useState<Priority>(task?.priority || "media")
  const [dueDate, setDueDate] = useState<Date | undefined>(task?.dueDate || defaultDueDate)
  const [dueTime, setDueTime] = useState<string>(task?.dueDate ? format(task.dueDate, "HH:mm") : "23:59")
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | undefined>(task?.estimatedMinutes)
  const [contextId, setContextId] = useState<string | undefined>(task?.contextId || defaultContextId)
  const [loading, setLoading] = useState(false)
  const [isCreatingContext, setIsCreatingContext] = useState(false)
  const [newContextName, setNewContextName] = useState("")
  const [newContextDescription, setNewContextDescription] = useState("")

  const { addTask, updateTask } = useTasks()
  const { contexts, addContext } = useContexts()

  // Determinar si estamos editando o creando
  const isEditing = task && task.id && task.id.trim() !== ""

  const handleCreateContext = async () => {
    if (!newContextName.trim()) return

    try {
      const contextData: any = {
        name: newContextName.trim(),
      }

      if (newContextDescription.trim()) {
        contextData.description = newContextDescription.trim()
      }

      await addContext(contextData)
      setNewContextName("")
      setNewContextDescription("")
      setIsCreatingContext(false)
    } catch (error) {
      console.error("Error al crear contexto:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    try {
      const taskData: any = {
        title: title.trim(),
        category,
        priority,
        completed: task?.completed || false,
      }

      if (description.trim()) {
        taskData.description = description.trim()
      }

      if (dueDate) {
        const [hours, minutes] = dueTime.split(":").map(Number)
        const dateWithTime = new Date(dueDate)
        dateWithTime.setHours(hours, minutes, 0, 0)
        taskData.dueDate = dateWithTime
      }

      if (estimatedMinutes && estimatedMinutes > 0) {
        taskData.estimatedMinutes = estimatedMinutes
      }

      if (contextId) {
        taskData.contextId = contextId
      }

      if (isEditing) {
        await updateTask(task.id, taskData)
      } else {
        await addTask(taskData)
      }

      // Reset form if creating new task
      if (!isEditing) {
        setTitle("")
        setDescription("")
        setCategory(defaultCategory || "Inbox")
        setPriority("media")
        setDueDate(defaultDueDate)
        setDueTime("23:59")
        setEstimatedMinutes(undefined)
        setContextId(defaultContextId)
      }

      onClose?.()
    } catch (error) {
      console.error("Error al guardar tarea:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (contextId === "new") {
      setContextId(undefined)
      setIsCreatingContext(true)
    }
  }, [contextId])

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-heading">
          {isEditing ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
          {isEditing ? "Editar Tarea" : "Nueva Tarea"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Título *</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="¿Qué necesitas hacer?"
              required
              className="text-lg"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Descripción</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles adicionales, notas, pasos específicos..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Categoría GTD</label>
              <Select value={category} onValueChange={(value: GTDCategory) => setCategory(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GTD_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Prioridad</label>
              <Select value={priority} onValueChange={(value: Priority) => setPriority(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${PRIORITY_COLORS[p]}`}>
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Tiempo Estimado (minutos)
              </label>
              <Input
                type="number"
                value={estimatedMinutes || ""}
                onChange={(e) => setEstimatedMinutes(e.target.value ? Number.parseInt(e.target.value) : undefined)}
                placeholder="ej: 30"
                min="1"
                max="480"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Contexto</label>
              {isCreatingContext ? (
                <div className="space-y-3">
                  <Input
                    value={newContextName}
                    onChange={(e) => setNewContextName(e.target.value)}
                    placeholder="Nombre del nuevo contexto"
                    className="mb-2"
                  />
                  <Input
                    value={newContextDescription}
                    onChange={(e) => setNewContextDescription(e.target.value)}
                    placeholder="Descripción (opcional)"
                    className="mb-2"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleCreateContext}
                      disabled={!newContextName.trim()}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Guardar Contexto
                    </Button>
                    <Button onClick={() => setIsCreatingContext(false)} variant="outline" size="sm">
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <Select
                  value={contextId || "none"}
                  onValueChange={(value) => setContextId(value === "none" ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar contexto..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin contexto</SelectItem>
                    {contexts.map((context) => (
                      <SelectItem key={context.id} value={context.id}>
                        {context.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="new" className="text-green-600 font-medium">
                      + Crear nuevo contexto
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Fecha límite (opcional)</label>
              <div className="space-y-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "PPP", { locale: es }) : "Seleccionar fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus />
                  </PopoverContent>
                </Popover>

                {dueDate && (
                  <div className="flex items-center gap-2">
                    <Input type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} className="w-32" />
                    <span className="text-sm text-gray-500">Hora límite</span>
                  </div>
                )}

                {dueDate && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDueDate(undefined)
                      setDueTime("23:59")
                    }}
                    className="mt-1 text-xs text-gray-500 hover:text-gray-700"
                  >
                    Quitar fecha
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Tips GTD según categoría */}
          {category === "Inbox" && (
            <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-gray-400">
              <p className="text-sm text-gray-700">
                💡 <strong>Inbox:</strong> Esta tarea será procesada después. Solo captura la idea por ahora.
              </p>
            </div>
          )}

          {category === "Próximas acciones" && (
            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
              <p className="text-sm text-blue-700">
                🎯 <strong>Próximas Acciones:</strong> Asegúrate de que sea una acción específica y concreta que puedas
                realizar.
              </p>
            </div>
          )}

          {category === "Multitarea" && (
            <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-400">
              <p className="text-sm text-purple-700">
                📋 <strong>Multitarea:</strong> Define claramente el resultado deseado y las próximas acciones
                necesarias.
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={loading || !title.trim()}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {loading ? "Guardando..." : isEditing ? "Actualizar" : "Crear Tarea"}
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

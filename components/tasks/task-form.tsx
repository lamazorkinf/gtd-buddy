"use client"

import type React from "react"
import type { EnergyLevel } from "@/types/task" // Import EnergyLevel

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox" // Importar Checkbox
import { CalendarIcon, Plus, Edit, Clock, Trash2, ListChecks } from "lucide-react" // Importar ListChecks y Trash2
import { format } from "date-fns"
import type { Task, GTDCategory, Priority, Subtask } from "@/types/task" // Importar Subtask
import { useTasks } from "@/hooks/use-tasks"
import { useContexts } from "@/hooks/use-contexts"
import { v4 as uuidv4 } from "uuid" // Para generar IDs únicos para subtareas

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
  const [subtasks, setSubtasks] = useState<Subtask[]>(task?.subtasks || [])
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("")
  const [loading, setLoading] = useState(false)
  const [isCreatingContext, setIsCreatingContext] = useState(isCreatingContext)
  const [newContextName, setNewContextName] = useState("")
  const [newContextDescription, setNewContextDescription] = useState("")

  const { addTask, updateTask } = useTasks()
  const { contexts, addContext } = useContexts()

  const isEditing = task && task.id && task.id.trim() !== ""

  useEffect(() => {
    if (task) {
      setTitle(task.title || "")
      setDescription(task.description || "")
      setCategory(task.category || defaultCategory || "Inbox")
      setPriority(task.priority || "media")
      setDueDate(task.dueDate)
      setDueTime(task.dueDate ? format(task.dueDate, "HH:mm") : "23:59")
      setEstimatedMinutes(task.estimatedMinutes)
      setContextId(task.contextId || undefined) // Asegurar que sea undefined si no hay contexto
      setSubtasks(task.subtasks || [])
    }
  }, [task, defaultCategory])

  const handleCreateContext = async () => {
    if (!newContextName.trim()) return
    try {
      const contextData: any = { name: newContextName.trim() }
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

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return
    setSubtasks([...subtasks, { id: uuidv4(), title: newSubtaskTitle.trim(), completed: false }])
    setNewSubtaskTitle("")
  }

  const handleToggleSubtask = (subtaskId: string) => {
    setSubtasks(subtasks.map((st) => (st.id === subtaskId ? { ...st, completed: !st.completed } : st)))
  }

  const handleRemoveSubtask = (subtaskId: string) => {
    setSubtasks(subtasks.filter((st) => st.id !== subtaskId))
  }

  const handleUpdateSubtaskTitle = (subtaskId: string, newTitle: string) => {
    setSubtasks(subtasks.map((st) => (st.id === subtaskId ? { ...st, title: newTitle } : st)))
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value
    if (dateValue) {
      // Crear la fecha en la zona horaria local para evitar problemas de UTC
      const [year, month, day] = dateValue.split("-").map(Number)
      const localDate = new Date(year, month - 1, day) // month - 1 porque los meses en JS van de 0-11
      setDueDate(localDate)
    } else {
      setDueDate(undefined)
    }
  }

  const formatDateForInput = (date: Date | undefined): string => {
    if (!date) return ""
    // Usar la fecha local sin conversión UTC
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
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

      if (description.trim()) taskData.description = description.trim()
      if (dueDate) {
        const [hours, minutes] = dueTime.split(":").map(Number)
        const dateWithTime = new Date(dueDate)
        dateWithTime.setHours(hours, minutes, 0, 0)
        taskData.dueDate = dateWithTime
      }
      if (estimatedMinutes && estimatedMinutes > 0) taskData.estimatedMinutes = estimatedMinutes
      if (contextId) taskData.contextId = contextId

      // Siempre incluir subtasks, incluso si está vacío
      taskData.subtasks = subtasks

      if (isEditing && task?.id) {
        // Asegurarse que task.id existe
        await updateTask(task.id, taskData)
      } else {
        await addTask(taskData)
      }

      if (!isEditing) {
        setTitle("")
        setDescription("")
        setCategory(defaultCategory || "Inbox")
        setPriority("media")
        setDueDate(defaultDueDate)
        setDueTime("23:59")
        setEstimatedMinutes(undefined)
        setContextId(defaultContextId)
        setSubtasks([])
      }
      onClose?.()
    } catch (error) {
      console.error("Error al guardar tarea:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Solo manejar la creación de nuevo contexto, no resetear contextId en edición
    if (contextId === "new") {
      setContextId(undefined)
      setIsCreatingContext(true)
    }
  }, [contextId])

  return (
    <div className="p-6">
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
                  <SelectContent className="modal-select-content">
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
                  <SelectContent className="modal-select-content">
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

            {/* Sección de Subtareas */}
            {category === "Multitarea" && (
              <div className="space-y-4 p-4 border rounded-md bg-slate-50">
                <h4 className="text-md font-semibold flex items-center gap-2 text-slate-700">
                  <ListChecks className="h-5 w-5" />
                  Subtareas del Proyecto
                </h4>
                <div className="space-y-2">
                  {subtasks.map((st, index) => (
                    <div key={st.id || index} className="flex items-center gap-2 p-2 bg-white rounded border">
                      <Checkbox
                        id={`subtask-${st.id}`}
                        checked={st.completed}
                        onCheckedChange={() => handleToggleSubtask(st.id)}
                      />
                      <Input
                        type="text"
                        value={st.title}
                        onChange={(e) => handleUpdateSubtaskTitle(st.id, e.target.value)}
                        className={`flex-grow text-sm ${st.completed ? "line-through text-gray-500" : ""}`}
                        placeholder="Descripción de la subtarea"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveSubtask(st.id)}
                        className="h-7 w-7 text-red-500 hover:bg-red-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    placeholder="Añadir nueva subtarea..."
                    className="flex-grow"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleAddSubtask()
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={handleAddSubtask}
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Plus className="h-4 w-4 mr-1" /> Añadir
                  </Button>
                </div>
                {subtasks.length === 0 && (
                  <p className="text-xs text-center text-gray-500 py-2">Aún no hay subtareas. ¡Añade la primera!</p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        type="button"
                        onClick={handleCreateContext}
                        disabled={!newContextName.trim()}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Guardar Contexto
                      </Button>
                      <Button type="button" onClick={() => setIsCreatingContext(false)} variant="outline" size="sm">
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Select
                    value={contextId || "none"}
                    onValueChange={(value) => {
                      if (value === "none") {
                        setContextId(undefined)
                      } else if (value === "new") {
                        setContextId(undefined)
                        setIsCreatingContext(true)
                      } else {
                        setContextId(value)
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar contexto..." />
                    </SelectTrigger>
                    <SelectContent className="modal-select-content">
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
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Fecha límite (opcional)</label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="date"
                      value={formatDateForInput(dueDate)}
                      onChange={handleDateChange}
                      className="pl-10"
                      placeholder="Seleccionar fecha"
                    />
                  </div>
                  {dueDate && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDueDate(undefined)
                        setDueTime("23:59")
                      }}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Quitar
                    </Button>
                  )}
                </div>

                {dueDate && (
                  <div className="flex items-center gap-2">
                    <Input type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} className="w-32" />
                    <span className="text-sm text-gray-500">Hora límite</span>
                  </div>
                )}
              </div>
            </div>

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
                  🎯 <strong>Próximas Acciones:</strong> Asegúrate de que sea una acción específica y concreta que
                  puedas realizar.
                </p>
              </div>
            )}
            {category === "Multitarea" && subtasks.length === 0 && (
              <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-400">
                <p className="text-sm text-purple-700">
                  📋 <strong>Multitarea:</strong> ¡Este es un proyecto! Define las subtareas necesarias para
                  completarlo.
                </p>
              </div>
            )}
            {category === "Multitarea" && subtasks.length > 0 && (
              <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-400">
                <p className="text-sm text-purple-700">
                  📈 <strong>Progreso del Proyecto:</strong> {subtasks.filter((st) => st.completed).length} de{" "}
                  {subtasks.length} subtareas completadas.
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
    </div>
  )
}

"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { CalendarIcon, Clock, Trash2, ListChecks, Calendar, AlertCircle, Edit, Plus } from "lucide-react"
import { format, isBefore, startOfDay, isValid } from "date-fns"
import { es } from "date-fns/locale"
import type { Task, GTDCategory, Subtask } from "@/types/task"
import { useTasks } from "@/hooks/use-tasks"
import { useContexts } from "@/hooks/use-contexts"
import { useTeamContext } from "@/contexts/team-context"
import { useTeamMembers } from "@/hooks/use-team-members"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import SubtaskEditModal from "./subtask-edit-modal"
import { modernTheme } from "@/lib/theme"

const safeDate = (value: unknown): Date | undefined => {
  if (!value) return undefined
  const date = value instanceof Date ? value : new Date(value as string | number)
  return isValid(date) ? date : undefined
}

interface TaskFormProps {
  task?: Task
  onClose?: () => void
  defaultCategory?: GTDCategory
  defaultDueDate?: Date
  defaultContextId?: string
}

const GTD_CATEGORIES: GTDCategory[] = ["Inbox", "Próximas acciones", "Multitarea", "A la espera", "Algún día"]

export default function TaskForm({ task, onClose, defaultCategory, defaultDueDate, defaultContextId }: TaskFormProps) {
  const [title, setTitle] = useState(task?.title || "")
  const [description, setDescription] = useState(task?.description || "")
  const [category, setCategory] = useState<GTDCategory>(task?.category || defaultCategory || "Inbox")
  const [dueDate, setDueDate] = useState<Date | undefined>(task?.dueDate || defaultDueDate)
  const [dueTime, setDueTime] = useState<string>(task?.dueDate ? format(task.dueDate, "HH:mm") : "23:59")
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | undefined>(task?.estimatedMinutes)
  const [contextId, setContextId] = useState<string | undefined>(task?.contextId || defaultContextId)
  const [subtasks, setSubtasks] = useState<Subtask[]>(task?.subtasks || [])
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("")
  const [loading, setLoading] = useState(false)
  const [isCreatingContext, setIsCreatingContext] = useState(false)
  const [newContextName, setNewContextName] = useState("")
  const [newContextDescription, setNewContextDescription] = useState("")
  const [editingSubtask, setEditingSubtask] = useState<Subtask | null>(null)
  const [assignedTo, setAssignedTo] = useState<string | undefined>(task?.assignedTo)

  const { selectedTeamId, isPersonalMode } = useTeamContext()
  const { addTask, updateTask, deleteTask } = useTasks({ teamId: selectedTeamId })
  const { contexts, addContext } = useContexts({ teamId: selectedTeamId })
  const { members } = useTeamMembers(!isPersonalMode && selectedTeamId ? selectedTeamId : "")

  const isEditing = task && task.id && task.id.trim() !== ""

  useEffect(() => {
    if (task) {
      setTitle(task.title || "")
      setDescription(task.description || "")
      setCategory(task.category || defaultCategory || "Inbox")
      setDueDate(task.dueDate)
      setDueTime(task.dueDate ? format(task.dueDate, "HH:mm") : "23:59")
      setEstimatedMinutes(task.estimatedMinutes)
      setContextId(task.contextId || undefined)
      setSubtasks(task.subtasks || [])
      setAssignedTo(task.assignedTo)
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

  const handleEditSubtask = (subtask: Subtask) => {
    setEditingSubtask(subtask)
  }

  const handleSaveSubtask = (updatedSubtask: Subtask) => {
    setSubtasks(subtasks.map((st) => (st.id === updatedSubtask.id ? updatedSubtask : st)))
    setEditingSubtask(null)
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value
    if (dateValue) {
      const [year, month, day] = dateValue.split("-").map(Number)
      const localDate = new Date(year, month - 1, day)
      setDueDate(localDate)
    } else {
      setDueDate(undefined)
    }
  }

  const formatDateForInput = (date: Date | undefined): string => {
    if (!date) return ""
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  const isSubtaskOverdue = (rawDate: unknown): boolean => {
    const d = safeDate(rawDate)
    return d ? isBefore(d, startOfDay(new Date())) : false
  }

  const isSubtaskDueToday = (rawDate: unknown): boolean => {
    const d = safeDate(rawDate)
    if (!d) return false
    return format(d, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
  }

  const handleDelete = async () => {
    if (!isEditing || !task?.id) return

    if (confirm("¿Estás seguro de que deseas eliminar esta tarea?")) {
      setLoading(true)
      try {
        await deleteTask(task.id)
        onClose?.()
      } catch (error) {
        console.error("Error al eliminar tarea:", error)
      } finally {
        setLoading(false)
      }
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
      if (!isPersonalMode && selectedTeamId) {
        taskData.teamId = selectedTeamId
        if (assignedTo) taskData.assignedTo = assignedTo
      }

      taskData.subtasks = subtasks

      if (isEditing && task?.id) {
        await updateTask(task.id, taskData)
      } else {
        await addTask(taskData)
      }

      if (!isEditing) {
        setTitle("")
        setDescription("")
        setCategory(defaultCategory || "Inbox")
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
    if (contextId === "new") {
      setContextId(undefined)
      setIsCreatingContext(true)
    }
  }, [contextId])

  return (
    <div className="p-6">
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

            {/* Sección de Subtareas */}
            {category === "Multitarea" && (
              <div className="space-y-4 p-4 border rounded-md bg-slate-50">
                <h4 className="text-md font-semibold flex items-center gap-2 text-slate-700">
                  <ListChecks className="h-5 w-5" />
                  Subtareas del Proyecto
                </h4>
                <div className="space-y-2">
                  {subtasks.map((st, index) => {
                    const isOverdue = isSubtaskOverdue(st.dueDate) && !st.completed
                    const isDueToday = isSubtaskDueToday(st.dueDate)

                    return (
                      <div
                        key={st.id || index}
                        className={`flex items-center gap-2 p-3 bg-white rounded border ${isOverdue ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                      >
                        <Checkbox
                          id={`subtask-${st.id}`}
                          checked={st.completed}
                          onCheckedChange={() => handleToggleSubtask(st.id)}
                        />
                        <div className="flex-grow">
                          <div className={`text-sm font-medium ${st.completed ? "line-through text-gray-500" : ""}`}>
                            {st.title}
                          </div>
                          {st.dueDate && (
                            <div
                              className={`text-xs mt-1 flex items-center gap-1 ${
                                isOverdue ? "text-red-600" : isDueToday ? "text-orange-600" : "text-gray-500"
                              }`}
                            >
                              {isOverdue ? <AlertCircle className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
                              {safeDate(st.dueDate) &&
                                format(safeDate(st.dueDate) as Date, "dd MMM yyyy", { locale: es })}
                              {isOverdue && " (Vencida)"}
                              {isDueToday && " (Hoy)"}
                            </div>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditSubtask(st)}
                          className="h-7 w-7 text-blue-500 hover:bg-blue-100"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
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
                    )
                  })}
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

            {/* Campo de asignación de miembro (solo en modo equipo) */}
            {!isPersonalMode && selectedTeamId && members.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Asignar a
                </label>
                <Select
                  value={assignedTo || "unassigned"}
                  onValueChange={(value) => setAssignedTo(value === "unassigned" ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin asignar" />
                  </SelectTrigger>
                  <SelectContent className="modal-select-content">
                    <SelectItem value="unassigned">
                      <span className="text-muted-foreground">Sin asignar</span>
                    </SelectItem>
                    {members.map((member) => (
                      <SelectItem key={member.userId} value={member.userId}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={member.photoURL || undefined} />
                            <AvatarFallback className="text-xs">
                              {member.displayName?.slice(0, 2).toUpperCase() || member.email.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span>{member.displayName || member.email}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

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

      {/* Modal para editar subtarea */}
      {editingSubtask && (
        <SubtaskEditModal
          subtask={editingSubtask}
          isOpen={!!editingSubtask}
          onClose={() => setEditingSubtask(null)}
          onSave={handleSaveSubtask}
        />
      )}
    </div>
  )
}

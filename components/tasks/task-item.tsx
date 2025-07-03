"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Calendar, Edit, AlertCircle, Inbox, ArrowRight, FolderOpen, Clock, ListChecks } from "lucide-react"
import { format, isBefore, startOfDay, isValid } from "date-fns"
import { es } from "date-fns/locale"
import type { Task, Subtask } from "@/types/task"
import { useTasks } from "@/hooks/use-tasks"
import { useContexts } from "@/hooks/use-contexts"
import SubtaskEditModal from "./subtask-edit-modal"

const safeDate = (value: unknown): Date | undefined => {
  if (!value) return undefined

  // Firestore Timestamp
  if (typeof value === "object" && value !== null && "toDate" in value) {
    try {
      return (value as any).toDate()
    } catch {
      return undefined
    }
  }

  // Firestore Timestamp con seconds
  if (typeof value === "object" && value !== null && "seconds" in value) {
    try {
      return new Date((value as any).seconds * 1000)
    } catch {
      return undefined
    }
  }

  // Date object
  if (value instanceof Date) {
    return isValid(value) ? value : undefined
  }

  // String or number
  try {
    const date = new Date(value as string | number)
    return isValid(date) ? date : undefined
  } catch {
    return undefined
  }
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

interface TaskItemProps {
  task: Task
  onEdit: (task: Task) => void
}

const PRIORITY_COLORS = {
  baja: "bg-green-100 text-green-800 border-green-200",
  media: "bg-yellow-100 text-yellow-800 border-yellow-200",
  alta: "bg-red-100 text-red-800 border-red-200",
}

const CATEGORY_COLORS = {
  Inbox: "bg-gray-100 text-gray-800",
  "Próximas acciones": "bg-blue-100 text-blue-800",
  Multitarea: "bg-purple-100 text-purple-800",
  "A la espera": "bg-orange-100 text-orange-800",
  "Algún día": "bg-green-100 text-green-800",
}

export default function TaskItem({ task, onEdit }: TaskItemProps) {
  const [loading, setLoading] = useState(false)
  const [editingSubtask, setEditingSubtask] = useState<Subtask | null>(null)
  const { updateTask, deleteTask } = useTasks()
  const { contexts } = useContexts()

  const taskContext = task.contextId ? contexts.find((c) => c.id === task.contextId) : null

  const handleToggleComplete = async () => {
    setLoading(true)
    try {
      await updateTask(task.id, { completed: !task.completed })
    } catch (error) {
      console.error("Error al actualizar tarea:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleSubtask = async (subtaskId: string) => {
    if (!task.subtasks) return
    const updatedSubtasks = task.subtasks.map((st) => (st.id === subtaskId ? { ...st, completed: !st.completed } : st))

    setLoading(true)
    try {
      await updateTask(task.id, {
        subtasks: updatedSubtasks,
      })
    } catch (error) {
      console.error("Error al actualizar subtarea:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditSubtask = (subtask: Subtask) => {
    setEditingSubtask(subtask)
  }

  const handleSaveSubtask = async (updatedSubtask: Subtask) => {
    if (!task.subtasks) return

    const updatedSubtasks = task.subtasks.map((st) => (st.id === updatedSubtask.id ? updatedSubtask : st))

    setLoading(true)
    try {
      await updateTask(task.id, {
        subtasks: updatedSubtasks,
      })
      setEditingSubtask(null)
    } catch (error) {
      console.error("Error al actualizar subtarea:", error)
    } finally {
      setLoading(false)
    }
  }

  const isOverdue = task.dueDate && isBefore(task.dueDate, startOfDay(new Date())) && !task.completed
  const isDueToday = task.dueDate && format(task.dueDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")

  const completedSubtasks = task.subtasks?.filter((st) => st.completed).length || 0
  const totalSubtasks = task.subtasks?.length || 0

  return (
    <>
      <Card
        className={`transition-all duration-200 hover:shadow-lg ${
          task.completed ? "opacity-60 bg-slate-50" : "bg-white"
        } ${isOverdue ? "border-red-400 bg-red-50 ring-2 ring-red-200" : "border-slate-200"}`}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Checkbox
              id={`task-${task.id}`}
              checked={task.completed}
              onCheckedChange={handleToggleComplete}
              disabled={loading}
              className="mt-1 flex-shrink-0"
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <label
                  htmlFor={`task-${task.id}`}
                  className={`font-semibold text-slate-800 cursor-pointer ${task.completed ? "line-through text-slate-500" : ""}`}
                >
                  {task.title}
                </label>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 p-0 flex-shrink-0 text-slate-500 hover:text-slate-700"
                  onClick={() => onEdit(task)}
                >
                  <Edit className="h-4 w-4" />
                  <span className="sr-only">Editar tarea</span>
                </Button>
              </div>

              {task.description && (
                <p className={`text-sm text-slate-600 mt-1 ${task.completed ? "line-through" : ""}`}>
                  {task.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2 mt-3">
                <Badge
                  variant="secondary"
                  className={`${CATEGORY_COLORS[task.category]} border ${task.category === "Multitarea" ? "border-purple-300" : "border-slate-300"}`}
                >
                  {task.category}
                </Badge>

                <Badge variant="outline" className={`${PRIORITY_COLORS[task.priority]} border`}>
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                </Badge>

                {taskContext && (
                  <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
                    @{taskContext.name}
                  </Badge>
                )}

                {task.dueDate && (
                  <Badge
                    variant="outline"
                    className={`flex items-center gap-1 ${
                      isOverdue
                        ? "bg-red-100 text-red-800 border-red-300"
                        : isDueToday
                          ? "bg-orange-100 text-orange-800 border-orange-300"
                          : "bg-slate-100 text-slate-800 border-slate-300"
                    }`}
                  >
                    {isOverdue ? <AlertCircle className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
                    {format(task.dueDate, "dd MMM", { locale: es })}
                  </Badge>
                )}
              </div>

              {/* Mostrar Subtareas si es Multitarea */}
              {task.category === "Multitarea" && task.subtasks && task.subtasks.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                    <span className="font-medium flex items-center gap-1">
                      <ListChecks className="h-3.5 w-3.5" /> Subtareas:
                    </span>
                    <span>
                      {completedSubtasks} / {totalSubtasks} completadas
                    </span>
                  </div>
                  {totalSubtasks > 0 && (
                    <div className="w-full bg-slate-200 rounded-full h-1.5 dark:bg-slate-700">
                      <div
                        className="bg-purple-500 h-1.5 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
                      ></div>
                    </div>
                  )}
                  <ul className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                    {task.subtasks.map((st) => {
                      const isSubOverdue = isSubtaskOverdue(st.dueDate) && !st.completed
                      const isSubDueToday = isSubtaskDueToday(st.dueDate)

                      return (
                        <li
                          key={st.id}
                          className={`flex items-center gap-2 text-sm p-2 rounded relative ${
                            isSubOverdue ? "bg-red-50 border border-red-200" : "bg-slate-50"
                          }`}
                        >
                          <Checkbox
                            id={`subtask-item-${task.id}-${st.id}`}
                            checked={st.completed}
                            onCheckedChange={() => handleToggleSubtask(st.id)}
                            disabled={loading}
                            className="flex-shrink-0"
                          />
                          <div className="flex-grow">
                            <label
                              htmlFor={`subtask-item-${task.id}-${st.id}`}
                              className={`block ${st.completed ? "line-through text-slate-500" : "text-slate-700"}`}
                            >
                              {st.title}
                            </label>
                            {st.dueDate && safeDate(st.dueDate) && (
                              <div
                                className={`text-xs mt-1 flex items-center gap-1 ${
                                  isSubOverdue ? "text-red-600" : isSubDueToday ? "text-orange-600" : "text-gray-500"
                                }`}
                              >
                                {isSubOverdue ? <AlertCircle className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
                                <span>
                                  {format(safeDate(st.dueDate) as Date, "dd MMM yyyy", { locale: es })}
                                  {isSubOverdue && " (Vencida)"}
                                  {isSubDueToday && " (Hoy)"}
                                </span>
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditSubtask(st)}
                            className="h-6 w-6 p-0 text-blue-500 hover:bg-blue-100 absolute top-1 right-1"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}

              {/* Botones de movimiento rápido */}
              <div className="flex flex-wrap gap-1 mt-3 pt-2 border-t border-slate-200">
                <span className="text-xs text-slate-500 mr-2 self-center">Mover a:</span>
                {[
                  { category: "Inbox", icon: Inbox, color: "text-slate-600 hover:text-slate-800 hover:bg-slate-100" },
                  {
                    category: "Próximas acciones",
                    icon: ArrowRight,
                    color: "text-blue-600 hover:text-blue-800 hover:bg-blue-50",
                  },
                  {
                    category: "Multitarea",
                    icon: FolderOpen,
                    color: "text-purple-600 hover:text-purple-800 hover:bg-purple-50",
                  },
                  {
                    category: "A la espera",
                    icon: Clock,
                    color: "text-orange-600 hover:text-orange-800 hover:bg-orange-50",
                  },
                  {
                    category: "Algún día",
                    icon: Calendar,
                    color: "text-green-600 hover:text-green-800 hover:bg-green-50",
                  },
                ].map((target) => {
                  if (task.category === target.category) return null
                  const IconComponent = target.icon
                  return (
                    <Button
                      key={target.category}
                      size="sm"
                      variant="outline"
                      className={`h-6 px-2 text-xs ${target.color} border-slate-300`}
                      onClick={async () => {
                        setLoading(true)
                        try {
                          await updateTask(task.id, { category: target.category as Task["category"] })
                        } catch (error) {
                          console.error("Error al mover tarea:", error)
                        } finally {
                          setLoading(false)
                        }
                      }}
                      disabled={loading}
                    >
                      <IconComponent className="h-3 w-3 mr-1" />
                      {target.category === "Próximas acciones" ? "Próximas" : target.category}
                    </Button>
                  )
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal para editar subtarea */}
      {editingSubtask && (
        <SubtaskEditModal
          subtask={editingSubtask}
          isOpen={!!editingSubtask}
          onClose={() => setEditingSubtask(null)}
          onSave={handleSaveSubtask}
        />
      )}
    </>
  )
}

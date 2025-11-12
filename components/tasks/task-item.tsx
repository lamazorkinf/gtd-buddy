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
import { useTeamContext } from "@/contexts/team-context"
import { useTeamMembers } from "@/hooks/use-team-members"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import SubtaskEditModal from "./subtask-edit-modal"
import { modernTheme } from "@/lib/theme"

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

const CATEGORY_COLORS = {
  Inbox: `${modernTheme.colors.badgeInbox}`,
  "Próximas acciones": `${modernTheme.colors.badgeNext}`,
  Multitarea: `${modernTheme.colors.badgeProject}`,
  "A la espera": `${modernTheme.colors.badgeWaiting}`,
  "Algún día": `${modernTheme.colors.badgeSomeday}`,
}

export default function TaskItem({ task, onEdit }: TaskItemProps) {
  const [loading, setLoading] = useState(false)
  const [editingSubtask, setEditingSubtask] = useState<Subtask | null>(null)
  const { selectedTeamId, isPersonalMode } = useTeamContext()
  const { updateTask, deleteTask } = useTasks({ teamId: selectedTeamId })
  const { contexts } = useContexts({ teamId: selectedTeamId })
  const { members } = useTeamMembers(!isPersonalMode && selectedTeamId ? selectedTeamId : "")

  const taskContext = task.contextId ? contexts.find((c) => c.id === task.contextId) : null
  const assignedMember = task.assignedTo ? members.find((m) => m.userId === task.assignedTo) : null

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
        className={`${modernTheme.effects.transition} ${modernTheme.container.radius} ${modernTheme.container.shadowMd} ${modernTheme.effects.glassHover} border ${
          task.completed ? "opacity-60 bg-white/30" : `${modernTheme.effects.glass}`
        } ${isOverdue ? `border-red-400 ${modernTheme.colors.cardRed} ring-2 ring-red-300/50` : modernTheme.colors.cardBorder}`}
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
                  className={`${modernTheme.typography.heading} ${modernTheme.colors.primaryText} cursor-pointer ${task.completed ? "line-through opacity-60" : ""} truncate max-w-full task-title`}
                >
                  {task.title}
                </label>

                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 p-0 flex-shrink-0 ${modernTheme.colors.muted} hover:${modernTheme.colors.primaryText} ${modernTheme.effects.transition}`}
                  onClick={() => onEdit(task)}
                >
                  <Edit className="h-4 w-4" />
                  <span className="sr-only">Editar tarea</span>
                </Button>
              </div>

              {task.description && (
                <p className={`text-sm ${modernTheme.colors.mutedForeground} mt-1 ${task.completed ? "line-through" : ""}`}>
                  {task.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2 mt-3">
                <Badge
                  variant="secondary"
                  className={`${CATEGORY_COLORS[task.category]} ${modernTheme.container.radius}`}
                >
                  {task.category}
                </Badge>

                {taskContext && (
                  <Badge variant="outline" className={`${modernTheme.colors.badgePurple} ${modernTheme.container.radius} truncate max-w-[120px] context-name`}>
                    @{taskContext.name}
                  </Badge>
                )}

                {assignedMember && (
                  <Badge variant="outline" className={`flex items-center gap-1.5 ${modernTheme.container.radius}`}>
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={assignedMember.photoURL || undefined} />
                      <AvatarFallback className="text-xs glassmorphism">
                        {assignedMember.displayName?.slice(0, 2).toUpperCase() || assignedMember.email.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs">{assignedMember.displayName || assignedMember.email.split('@')[0]}</span>
                  </Badge>
                )}

                {task.dueDate && (
                  <Badge
                    variant="outline"
                    className={`flex items-center gap-1 ${modernTheme.container.radius} ${
                      isOverdue
                        ? `${modernTheme.colors.badgeRed}`
                        : isDueToday
                          ? `${modernTheme.colors.badgeOrange}`
                          : `${modernTheme.colors.badgeBlue}`
                    }`}
                  >
                    {isOverdue ? <AlertCircle className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
                    {format(task.dueDate, "dd MMM", { locale: es })}
                  </Badge>
                )}
              </div>

              {/* Mostrar Subtareas si es Multitarea */}
              {task.category === "Multitarea" && task.subtasks && task.subtasks.length > 0 && (
                <div className={`mt-4 pt-4 border-t ${modernTheme.colors.cardBorder} space-y-3`}>
                  <div className={`flex items-center justify-between text-xs ${modernTheme.colors.mutedForeground}`}>
                    <span className={`${modernTheme.typography.heading} flex items-center gap-1.5 ${modernTheme.colors.primaryText}`}>
                      <ListChecks className="h-4 w-4" /> Subtareas
                    </span>
                    <Badge className={`${modernTheme.colors.badgePurple} ${modernTheme.container.radius} text-xs`}>
                      {completedSubtasks} / {totalSubtasks}
                    </Badge>
                  </div>
                  {totalSubtasks > 0 && (
                    <div className={`w-full bg-white/40 ${modernTheme.container.radius} h-2 overflow-hidden`}>
                      <div
                        className={`${modernTheme.colors.primary} h-2 ${modernTheme.effects.transition}`}
                        style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
                      ></div>
                    </div>
                  )}
                  <ul className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                    {task.subtasks.map((st) => {
                      const isSubOverdue = isSubtaskOverdue(st.dueDate) && !st.completed
                      const isSubDueToday = isSubtaskDueToday(st.dueDate)

                      return (
                        <li
                          key={st.id}
                          className={`flex items-start gap-2.5 text-sm p-3 ${modernTheme.container.radius} relative ${modernTheme.effects.transition} ${modernTheme.effects.glassHover} border ${
                            isSubOverdue ? `${modernTheme.colors.cardRed} ring-1 ring-red-300/50` : `${modernTheme.colors.secondary} ${modernTheme.colors.cardBorder}`
                          }`}
                        >
                          <Checkbox
                            id={`subtask-item-${task.id}-${st.id}`}
                            checked={st.completed}
                            onCheckedChange={() => handleToggleSubtask(st.id)}
                            disabled={loading}
                            className="flex-shrink-0 mt-0.5"
                          />
                          <div className="flex-grow min-w-0">
                            <label
                              htmlFor={`subtask-item-${task.id}-${st.id}`}
                              className={`block cursor-pointer ${st.completed ? "line-through opacity-60" : ""} truncate max-w-full`}
                            >
                              {st.title}
                            </label>
                            {st.dueDate && safeDate(st.dueDate) && (
                              <Badge
                                variant="outline"
                                className={`text-xs mt-1.5 ${modernTheme.container.radius} ${
                                  isSubOverdue ? `${modernTheme.colors.badgeRed}` : isSubDueToday ? `${modernTheme.colors.badgeOrange}` : `${modernTheme.colors.badgeBlue}`
                                }`}
                              >
                                {isSubOverdue ? <AlertCircle className="h-3 w-3 mr-1" /> : <Calendar className="h-3 w-3 mr-1" />}
                                {format(safeDate(st.dueDate) as Date, "dd MMM", { locale: es })}
                              </Badge>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditSubtask(st)}
                            className={`h-7 w-7 p-0 ${modernTheme.colors.primaryText} hover:bg-purple-100/50 ${modernTheme.effects.transition} flex-shrink-0`}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}

              {/* Botones de movimiento rápido */}
              <div className={`flex flex-wrap gap-1.5 mt-3 pt-3 border-t ${modernTheme.colors.cardBorder}`}>
                <span className={`text-xs ${modernTheme.colors.mutedForeground} mr-2 self-center`}>Mover a:</span>
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
                      className={`h-7 px-2.5 text-xs ${target.color} ${modernTheme.container.radius} ${modernTheme.effects.transition}`}
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

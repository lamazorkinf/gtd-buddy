"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Calendar, MoreVertical, Edit, Trash2, AlertCircle } from "lucide-react"
import { format, isBefore, startOfDay } from "date-fns"
import { es } from "date-fns/locale"
import type { Task } from "@/types/task"
import { useTasks } from "@/hooks/use-tasks"
import { useContexts } from "@/hooks/use-contexts"

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
  Proyectos: "bg-purple-100 text-purple-800",
  "A la espera": "bg-orange-100 text-orange-800",
  "Algún día": "bg-green-100 text-green-800",
}

export default function TaskItem({ task, onEdit }: TaskItemProps) {
  const [loading, setLoading] = useState(false)
  const { updateTask, deleteTask } = useTasks()
  const { contexts } = useContexts() // Añadir esta línea

  // Encontrar el contexto de la tarea si existe
  const taskContext = task.contextId ? contexts.find((c) => c.id === task.contextId) : null // Añadir esta línea

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

  const handleDelete = async () => {
    if (confirm("¿Estás seguro de que quieres eliminar esta tarea?")) {
      setLoading(true)
      try {
        await deleteTask(task.id)
      } catch (error) {
        console.error("Error al eliminar tarea:", error)
      } finally {
        setLoading(false)
      }
    }
  }

  const isOverdue = task.dueDate && isBefore(task.dueDate, startOfDay(new Date())) && !task.completed
  const isDueToday = task.dueDate && format(task.dueDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")

  return (
    <Card
      className={`transition-all duration-200 hover:shadow-md ${
        task.completed ? "opacity-75 bg-gray-50" : ""
      } ${isOverdue ? "border-red-300 bg-red-50" : ""}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={task.completed}
            onCheckedChange={handleToggleComplete}
            disabled={loading}
            className="mt-1"
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className={`font-medium text-gray-900 ${task.completed ? "line-through text-gray-500" : ""}`}>
                {task.title}
              </h3>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(task)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {task.description && (
              <p className={`text-sm text-gray-600 mt-1 ${task.completed ? "line-through" : ""}`}>{task.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-2 mt-3">
              <Badge variant="secondary" className={CATEGORY_COLORS[task.category]}>
                {task.category}
              </Badge>

              <Badge variant="outline" className={PRIORITY_COLORS[task.priority]}>
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
                        : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {isOverdue ? <AlertCircle className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
                  {format(task.dueDate, "dd MMM", { locale: es })}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

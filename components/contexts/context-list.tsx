"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { Target, MoreVertical, Edit, Trash2, Plus, Calendar, CheckCircle, Clock, Pause, Lightbulb } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { Context } from "@/types/task"
import { useContexts } from "@/hooks/use-contexts"
import { useTasks } from "@/hooks/use-tasks"

interface ContextListProps {
  onEditContext: (context: Context) => void
  onCreateTask: (contextId: string) => void
}

const CONTEXT_STATUS_CONFIG = {
  active: {
    icon: Target,
    label: "Activo",
    color: "bg-green-100 text-green-800 border-green-300",
    emoji: "🎯",
  },
  on_hold: {
    icon: Pause,
    label: "En Pausa",
    color: "bg-yellow-100 text-yellow-800 border-yellow-300",
    emoji: "⏸️",
  },
  completed: {
    icon: CheckCircle,
    label: "Completado",
    color: "bg-blue-100 text-blue-800 border-blue-300",
    emoji: "✅",
  },
  someday: {
    icon: Lightbulb,
    label: "Algún Día",
    color: "bg-gray-100 text-gray-800 border-gray-300",
    emoji: "🌱",
  },
}

export default function ContextList({ onEditContext, onCreateTask }: ContextListProps) {
  const [selectedStatus, setSelectedStatus] = useState<Context["status"] | "all">("all")
  const { contexts, loading, deleteContext } = useContexts()
  const { tasks, getTasksByContextId } = useTasks()

  const filteredContexts = contexts.filter(
    (context) =>
      selectedStatus === "all" || context.status === selectedStatus || (!context.status && selectedStatus === "active"), // Tratar contextos sin status como activos
  )

  const getContextTasks = (contextId: string) => {
    return getTasksByContextId(contextId)
  }

  const getContextProgress = (contextId: string) => {
    const contextTasks = getContextTasks(contextId)
    if (contextTasks.length === 0) return 0
    const completedTasks = contextTasks.filter((task) => task.completed).length
    return Math.round((completedTasks / contextTasks.length) * 100)
  }

  const handleDeleteContext = async (contextId: string) => {
    const contextTasks = getContextTasks(contextId)

    if (contextTasks.length > 0) {
      if (
        !confirm(
          `Este contexto tiene ${contextTasks.length} tareas asociadas. ¿Eliminar el contexto? Las tareas quedarán sin contexto asignado.`,
        )
      ) {
        return
      }
    } else {
      if (!confirm("¿Eliminar este contexto? No se puede deshacer.")) {
        return
      }
    }

    try {
      await deleteContext(contextId)
    } catch (error) {
      console.error("Error al eliminar contexto:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedStatus === "all" ? "default" : "outline"}
          onClick={() => setSelectedStatus("all")}
          size="sm"
        >
          Todos ({contexts.length})
        </Button>
        {Object.entries(CONTEXT_STATUS_CONFIG).map(([status, config]) => {
          const count = contexts.filter((c) => c.status === status || (!c.status && status === "active")).length
          return (
            <Button
              key={status}
              variant={selectedStatus === status ? "default" : "outline"}
              onClick={() => setSelectedStatus(status as Context["status"])}
              size="sm"
            >
              {config.emoji} {config.label} ({count})
            </Button>
          )
        })}
      </div>

      {/* Lista de contextos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredContexts.map((context) => {
          const contextTasks = getContextTasks(context.id)
          const progress = getContextProgress(context.id)
          const statusConfig = CONTEXT_STATUS_CONFIG[context.status || "active"]
          const StatusIcon = statusConfig.icon

          return (
            <Card key={context.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <StatusIcon className="h-5 w-5 text-gray-600" />
                      <CardTitle className="text-lg font-heading">{context.name}</CardTitle>
                    </div>
                    <Badge variant="outline" className={statusConfig.color}>
                      {statusConfig.emoji} {statusConfig.label}
                    </Badge>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEditContext(context)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onCreateTask(context.id)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Añadir Tarea
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteContext(context.id)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {context.description && <p className="text-sm text-gray-600">{context.description}</p>}

                {/* Progreso */}
                {contextTasks.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Progreso</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{contextTasks.filter((t) => t.completed).length} completadas</span>
                      <span>{contextTasks.length} total</span>
                    </div>
                  </div>
                )}

                {/* Información adicional */}
                <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                  {context.targetDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>Meta: {format(context.targetDate, "dd MMM yyyy", { locale: es })}</span>
                    </div>
                  )}
                  {context.lastReviewed && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>Revisado: {format(context.lastReviewed, "dd MMM", { locale: es })}</span>
                    </div>
                  )}
                </div>

                {/* Acciones rápidas */}
                <div className="flex gap-2 pt-2">
                  <Button onClick={() => onCreateTask(context.id)} size="sm" variant="outline" className="flex-1">
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Tarea
                  </Button>
                  <Button onClick={() => onEditContext(context)} size="sm" variant="outline">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredContexts.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No hay contextos</h3>
            <p className="text-gray-500 mb-4">
              {selectedStatus === "all"
                ? "Crea tu primer contexto para organizar tareas relacionadas."
                : `No hay contextos con estado "${CONTEXT_STATUS_CONFIG[selectedStatus as Context["status"]]?.label}".`}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

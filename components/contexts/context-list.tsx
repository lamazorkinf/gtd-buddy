"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Target, Edit, Calendar, CheckCircle, Clock, Pause, Lightbulb, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { Context } from "@/types/task"
import { useContexts } from "@/hooks/use-contexts"
import { useTasks } from "@/hooks/use-tasks"

interface ContextListProps {
  onEditContext: (context: Context) => void
  onCreateTask: (contextId: string) => void
}

const CONTEXT_STATUS_CONFIG: Record<
  Context["status"] & string,
  { icon: React.ElementType; label: string; color: string; emoji: string; progressColor: string }
> = {
  active: {
    icon: Target,
    label: "Activo",
    color: "bg-gtd-confidence-100 text-gtd-confidence-800 border-gtd-confidence-300",
    emoji: "🎯",
    progressColor: "bg-gtd-confidence-500",
  },
  on_hold: {
    icon: Pause,
    label: "En Pausa",
    color: "bg-yellow-100 text-yellow-800 border-yellow-300",
    emoji: "⏸️",
    progressColor: "bg-yellow-500",
  },
  completed: {
    icon: CheckCircle,
    label: "Completado",
    color: "bg-gtd-focus-100 text-gtd-focus-800 border-gtd-focus-300",
    emoji: "✅",
    progressColor: "bg-gtd-focus-500",
  },
  someday: {
    icon: Lightbulb,
    label: "Algún Día",
    color: "bg-gtd-neutral-200 text-gtd-neutral-800 border-gtd-neutral-300",
    emoji: "🌱",
    progressColor: "bg-gtd-neutral-500",
  },
}

export default function ContextList({ onEditContext, onCreateTask }: ContextListProps) {
  const [selectedStatus, setSelectedStatus] = useState<Context["status"] | "all">("all")
  const { contexts, loading, deleteContext } = useContexts()
  const { getTasksByContextId } = useTasks() // Removed 'tasks' as it's not directly used here

  const filteredContexts = contexts.filter(
    (context) =>
      selectedStatus === "all" || context.status === selectedStatus || (!context.status && selectedStatus === "active"),
  )

  const getContextProgress = (contextId: string) => {
    const contextTasks = getTasksByContextId(contextId)
    if (contextTasks.length === 0) return { progress: 0, completed: 0, total: 0 }
    const completedTasks = contextTasks.filter((task) => task.completed).length
    return {
      progress: Math.round((completedTasks / contextTasks.length) * 100),
      completed: completedTasks,
      total: contextTasks.length,
    }
  }

  const handleDeleteContext = async (contextId: string) => {
    const { total: totalTasks } = getContextProgress(contextId)
    const confirmMessage =
      totalTasks > 0
        ? `Este contexto tiene ${totalTasks} tareas asociadas. ¿Eliminar el contexto? Las tareas quedarán sin contexto asignado.`
        : "¿Eliminar este contexto? No se puede deshacer."

    if (!confirm(confirmMessage)) return

    try {
      await deleteContext(contextId)
    } catch (error) {
      console.error("Error al eliminar contexto:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-10 w-10 animate-spin text-gtd-clarity-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 p-4 bg-white/70 backdrop-blur-sm rounded-xl shadow border border-gtd-neutral-100">
        <Button
          variant={selectedStatus === "all" ? "default" : "outline"}
          onClick={() => setSelectedStatus("all")}
          size="sm"
          className={
            selectedStatus === "all"
              ? "bg-gtd-clarity-500 text-white hover:bg-gtd-clarity-600"
              : "text-gtd-neutral-700 border-gtd-neutral-300 hover:bg-gtd-neutral-100"
          }
        >
          Todos ({contexts.length})
        </Button>
        {Object.entries(CONTEXT_STATUS_CONFIG).map(([statusKey, config]) => {
          const statusValue = statusKey as Context["status"]
          const count = contexts.filter(
            (c) => c.status === statusValue || (!c.status && statusValue === "active"),
          ).length
          return (
            <Button
              key={statusKey}
              variant={selectedStatus === statusValue ? "default" : "outline"}
              onClick={() => setSelectedStatus(statusValue)}
              size="sm"
              className={
                selectedStatus === statusValue
                  ? "bg-gtd-clarity-500 text-white hover:bg-gtd-clarity-600"
                  : "text-gtd-neutral-700 border-gtd-neutral-300 hover:bg-gtd-neutral-100"
              }
            >
              {config.emoji} {config.label} ({count})
            </Button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredContexts.map((context) => {
          const { progress, completed, total } = getContextProgress(context.id)
          const statusConfig = CONTEXT_STATUS_CONFIG[context.status || "active"]
          const StatusIcon = statusConfig.icon

          return (
            <Card
              key={context.id}
              className="hover:shadow-lg transition-shadow duration-300 bg-white/95 border border-gtd-neutral-100"
            >
              <CardHeader className="border-b border-gtd-neutral-100">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <StatusIcon className={`h-6 w-6 ${statusConfig.color.split(" ")[1]}`} />{" "}
                      {/* Use text color for icon */}
                      <CardTitle className="text-xl font-heading text-gtd-clarity-700">{context.name}</CardTitle>
                    </div>
                    <Badge variant="outline" className={`${statusConfig.color} text-xs`}>
                      {statusConfig.emoji} {statusConfig.label}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEditContext(context)}
                    className="h-8 w-8 text-gtd-neutral-500 hover:bg-gtd-neutral-100"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {context.description && (
                  <p className="text-sm text-gtd-neutral-600 italic bg-gtd-neutral-50 p-3 rounded-md border-l-4 border-gtd-neutral-200">
                    {context.description}
                  </p>
                )}
                {total > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gtd-neutral-600">Progreso</span>
                      <span className={`font-medium ${statusConfig.color.split(" ")[1]}`}>{progress}%</span>
                    </div>
                    <Progress
                      value={progress}
                      className="h-2 [&>*]:bg-gradient-to-r [&>*]:from-gtd-clarity-400 [&>*]:to-gtd-action-400"
                    />
                    <div className="flex justify-between text-xs text-gtd-neutral-500">
                      <span>{completed} completadas</span>
                      <span>{total} total</span>
                    </div>
                  </div>
                )}
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-gtd-neutral-500">
                  {context.targetDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" /> Meta:{" "}
                      {format(context.targetDate, "dd MMM yyyy", { locale: es })}
                    </div>
                  )}
                  {context.lastReviewed && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> Revisado:{" "}
                      {format(context.lastReviewed, "dd MMM", { locale: es })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
      {filteredContexts.length === 0 && (
        <Card className="bg-white/80 backdrop-blur-sm border border-gtd-neutral-100">
          <CardContent className="p-8 text-center">
            <Target className="h-12 w-12 text-gtd-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gtd-neutral-700 mb-2 font-heading">No hay contextos</h3>
            <p className="text-gtd-neutral-500 mb-4">
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

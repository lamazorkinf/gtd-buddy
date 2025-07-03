"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Edit, Target, Loader2 } from "lucide-react"
import type { Context } from "@/types/task"
import { useContexts } from "@/hooks/use-contexts"

interface ContextListProps {
  onEditContext: (context: Context) => void
  onCreateTask: (contextId: string) => void
}

const CONTEXT_STATUS_CONFIG: Record<
  Context["status"] & string,
  { label: string; color: string; emoji: string; badgeClass: string }
> = {
  active: {
    label: "Activo",
    color: "text-gtd-confidence-700",
    emoji: "🟢",
    badgeClass: "bg-green-100 text-green-800 border-green-300",
  },
  inactive: {
    label: "Inactivo",
    color: "text-gtd-neutral-700",
    emoji: "⚪",
    badgeClass: "bg-gray-100 text-gray-800 border-gray-300",
  },
}

export default function ContextList({ onEditContext, onCreateTask }: ContextListProps) {
  const [selectedStatus, setSelectedStatus] = useState<Context["status"] | "all">("all")
  const { contexts, loading, deleteContext } = useContexts()

  const filteredContexts = contexts.filter(
    (context) =>
      selectedStatus === "all" || context.status === selectedStatus || (!context.status && selectedStatus === "active"),
  )

  const handleDeleteContext = async (contextId: string) => {
    if (!confirm("¿Eliminar este contexto? No se puede deshacer.")) return

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredContexts.map((context) => {
          const statusConfig = CONTEXT_STATUS_CONFIG[context.status || "active"]

          return (
            <Card
              key={context.id}
              className="hover:shadow-md transition-shadow duration-300 bg-white/95 border border-gtd-neutral-100"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-heading text-gtd-clarity-700">{context.name}</CardTitle>
                    <Badge variant="outline" className={`${statusConfig.badgeClass} text-xs mt-1`}>
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
              <CardContent className="pt-0">
                {context.description && (
                  <p className="text-sm text-gtd-neutral-600 mt-2 line-clamp-2">{context.description}</p>
                )}
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

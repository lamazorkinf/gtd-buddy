"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, ArrowRight, Clock, Archive, Target, Calendar, Zap } from "lucide-react"
import type { Task, GTDCategory } from "@/types/task"
import { useTasks } from "@/hooks/use-tasks"

interface InboxProcessorProps {
  inboxTasks: Task[]
}

export default function InboxProcessor({ inboxTasks }: InboxProcessorProps) {
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0)
  const [processing, setProcessing] = useState(false)
  const [hoveredCategory, setHoveredCategory] = useState<GTDCategory | null>(null)
  const { updateTask, deleteTask } = useTasks()

  const currentTask = inboxTasks[currentTaskIndex]

  if (!currentTask) {
    return (
      <Card className="text-center border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardContent className="p-12">
          <div className="animate-bounce">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
          </div>
          <h3 className="text-3xl font-bold text-green-700 mb-4 font-heading">¡Inbox Procesado!</h3>
          <p className="text-lg text-green-600 mb-4">
            Todas las tareas han sido aclaradas y organizadas según el método GTD.
          </p>
          <Badge variant="outline" className="text-green-700 border-green-300 bg-green-100">
            Sistema GTD actualizado ✨
          </Badge>
        </CardContent>
      </Card>
    )
  }

  const handleQuickAction = async () => {
    setProcessing(true)
    try {
      await updateTask(currentTask.id, {
        completed: true,
        isQuickAction: true,
        category: "Próximas acciones",
      })
      setCurrentTaskIndex((prev) => prev + 1)
    } catch (error) {
      console.error("Error al completar tarea rápida:", error)
    } finally {
      setProcessing(false)
    }
  }

  const handleMoveToCategory = async (category: GTDCategory, updates: Partial<Task> = {}) => {
    setProcessing(true)
    try {
      await updateTask(currentTask.id, {
        category,
        lastReviewed: new Date(),
        ...updates,
      })
      setCurrentTaskIndex((prev) => prev + 1)
    } catch (error) {
      console.error("Error al mover tarea:", error)
    } finally {
      setProcessing(false)
    }
  }

  const handleDelete = async () => {
    if (confirm("¿Eliminar esta tarea? No se puede deshacer.")) {
      setProcessing(true)
      try {
        await deleteTask(currentTask.id)
        setCurrentTaskIndex((prev) => prev + 1)
      } catch (error) {
        console.error("Error al eliminar tarea:", error)
      } finally {
        setProcessing(false)
      }
    }
  }

  const categories = [
    {
      id: "Próximas acciones" as GTDCategory,
      title: "Próximas Acciones",
      description: "Acción clara y específica que puedes realizar",
      icon: ArrowRight,
      bgColor: "from-blue-50 to-blue-100",
      borderColor: "border-blue-300",
      textColor: "text-blue-700",
      hoverColor: "hover:from-blue-100 hover:to-blue-200",
    },
    {
      id: "Multitarea" as GTDCategory,
      title: "Multitarea",
      description: "Requiere múltiples acciones para completarse",
      icon: Target,
      bgColor: "from-purple-50 to-purple-100",
      borderColor: "border-purple-300",
      textColor: "text-purple-700",
      hoverColor: "hover:from-purple-100 hover:to-purple-200",
    },
    {
      id: "A la espera" as GTDCategory,
      title: "A la Espera",
      description: "Depende de terceros o respuestas externas",
      icon: Clock,
      bgColor: "from-orange-50 to-orange-100",
      borderColor: "border-orange-300",
      textColor: "text-orange-700",
      hoverColor: "hover:from-orange-100 hover:to-orange-200",
    },
    {
      id: "Algún día" as GTDCategory,
      title: "Algún Día",
      description: "Ideas para considerar en el futuro",
      icon: Calendar,
      bgColor: "from-green-50 to-green-100",
      borderColor: "border-green-300",
      textColor: "text-green-700",
      hoverColor: "hover:from-green-100 hover:to-green-200",
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header con progreso mejorado */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold font-heading bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Procesar Inbox
          </h2>
          <Badge variant="outline" className="text-sm px-2 py-1 border-purple-300 bg-purple-50">
            {currentTaskIndex + 1} de {inboxTasks.length}
          </Badge>
        </div>

        {/* Barra de progreso mejorada */}
        <div className="relative w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${((currentTaskIndex + 1) / inboxTasks.length) * 100}%` }}
          />
          <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse" />
        </div>
      </div>

      {/* Tarea actual - Título destacado */}
      <Card className="border-2 border-purple-200 shadow-lg bg-gradient-to-br from-white to-purple-50">
        <CardHeader className="text-center pb-3">
          <CardTitle className="text-2xl font-bold font-heading text-gray-800 leading-tight">
            {currentTask.title}
          </CardTitle>
          {currentTask.description && (
            <p className="text-base text-gray-600 mt-3 leading-relaxed">{currentTask.description}</p>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Zona central - Dos caminos principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Regla de 2 minutos - Destacada */}
            <Card className="bg-gradient-to-br from-yellow-50 to-amber-100 border-2 border-yellow-300 shadow-md hover:shadow-lg transition-all duration-200">
              <CardContent className="p-4 text-center">
                <div className="mb-4">
                  <div className="bg-yellow-200 rounded-full p-2 w-fit mx-auto mb-3">
                    <Zap className="h-6 w-6 text-yellow-700" />
                  </div>
                  <h4 className="font-bold text-lg text-yellow-800 mb-2">Regla de 2 Minutos</h4>
                  <p className="text-xs text-yellow-700 mb-4">
                    Si puedes hacerlo ahora en menos de 2 minutos, hazlo inmediatamente.
                  </p>
                </div>
                <Button
                  onClick={handleQuickAction}
                  disabled={processing}
                  className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white font-semibold py-2 text-base shadow-md"
                  size="default"
                >
                  ✅ Hacer Ahora
                </Button>
              </CardContent>
            </Card>

            {/* No es accionable - Destacada */}
            <Card className="bg-gradient-to-br from-gray-50 to-slate-100 border-2 border-gray-300 shadow-md hover:shadow-lg transition-all duration-200">
              <CardContent className="p-4 text-center">
                <div className="mb-4">
                  <div className="bg-gray-200 rounded-full p-2 w-fit mx-auto mb-3">
                    <Archive className="h-6 w-6 text-gray-700" />
                  </div>
                  <h4 className="font-bold text-lg text-gray-800 mb-2">No es Accionable</h4>
                  <p className="text-xs text-gray-700 mb-4">Si no requiere acción, elimínala.</p>
                </div>
                <Button
                  onClick={handleDelete}
                  disabled={processing}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-2 text-base shadow-md"
                  size="default"
                >
                  🗑️ Eliminar
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Categorías GTD - Con colores de fondo y efectos */}
          <div className="space-y-4">
            <div className="text-center">
              <h4 className="font-bold text-lg text-gray-800 mb-2">U Organizar en Categoría GTD:</h4>
              <p className="text-gray-600">Selecciona dónde debe ir esta tarea en tu sistema</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map((category) => {
                const Icon = category.icon
                const isHovered = hoveredCategory === category.id

                return (
                  <Button
                    key={category.id}
                    onClick={() => handleMoveToCategory(category.id)}
                    disabled={processing}
                    variant="outline"
                    className={`
                      h-auto p-4 justify-start text-left transition-all duration-300 transform
                      bg-gradient-to-br ${category.bgColor} ${category.borderColor} ${category.hoverColor}
                      ${isHovered ? "scale-105 shadow-lg" : "hover:scale-102 shadow-md"}
                      border-2
                    `}
                    onMouseEnter={() => setHoveredCategory(category.id)}
                    onMouseLeave={() => setHoveredCategory(null)}
                  >
                    <div className="flex items-start gap-4 w-full">
                      <div
                        className={`p-1.5 rounded-lg bg-white/50 ${isHovered ? "bg-white/80" : ""} transition-all duration-200`}
                      >
                        <Icon className={`h-5 w-5 ${category.textColor}`} />
                      </div>
                      <div className="flex-1">
                        <div className={`font-bold text-base ${category.textColor} mb-1`}>{category.title}</div>
                        <div className={`text-xs ${category.textColor} opacity-80`}>{category.description}</div>
                      </div>
                      {isHovered && <ArrowRight className={`h-5 w-5 ${category.textColor} animate-pulse`} />}
                    </div>
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Botón para saltar - Mejorado */}
          <div className="pt-6 border-t border-gray-200">
            <Button
              onClick={() => setCurrentTaskIndex((prev) => prev + 1)}
              disabled={processing}
              variant="ghost"
              className="w-full py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all duration-200"
            >
              <span className="mr-2">⏭️</span>
              Saltar por Ahora (procesaré después)
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Indicador de progreso adicional */}
      <div className="text-center">
        <p className="text-sm text-gray-500">
          {inboxTasks.length - currentTaskIndex - 1} tareas restantes por procesar
        </p>
      </div>
    </div>
  )
}

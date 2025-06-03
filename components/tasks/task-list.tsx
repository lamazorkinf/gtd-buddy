"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Inbox, ArrowRight, FolderOpen, Clock, Calendar, Search, Filter } from "lucide-react"
import type { Task, GTDCategory, Priority } from "@/types/task"
import { useTasks } from "@/hooks/use-tasks"
import TaskItem from "./task-item"
import { useContexts } from "@/hooks/use-contexts"

interface TaskListProps {
  onEditTask: (task: Task) => void
}

const CATEGORY_ICONS = {
  Inbox: Inbox,
  "Próximas acciones": ArrowRight,
  Multitarea: FolderOpen,
  "A la espera": Clock,
  "Algún día": Calendar,
}

const CATEGORY_COLORS = {
  Inbox: "from-gray-500 to-gray-600",
  "Próximas acciones": "from-blue-500 to-blue-600",
  Multitarea: "from-purple-500 to-purple-600",
  "A la espera": "from-orange-500 to-orange-600",
  "Algún día": "from-green-500 to-green-600",
}

export default function TaskList({ onEditTask }: TaskListProps) {
  const { tasks, loading } = useTasks()
  const { contexts } = useContexts()
  const [selectedCategory, setSelectedCategory] = useState<GTDCategory | "all">("all")
  const [selectedPriority, setSelectedPriority] = useState<Priority | "all">("all")
  const [selectedContext, setSelectedContext] = useState<string | "all">("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [showCompleted, setShowCompleted] = useState(false)

  const filteredTasks = tasks.filter((task) => {
    const matchesCategory = selectedCategory === "all" || task.category === selectedCategory
    const matchesPriority = selectedPriority === "all" || task.priority === selectedPriority
    const matchesContext = selectedContext === "all" || task.contextId === selectedContext
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCompleted = showCompleted || !task.completed

    return matchesCategory && matchesPriority && matchesContext && matchesSearch && matchesCompleted
  })

  const groupedTasks = filteredTasks.reduce(
    (acc, task) => {
      if (!acc[task.category]) {
        acc[task.category] = []
      }
      acc[task.category].push(task)
      return acc
    },
    {} as Record<GTDCategory, Task[]>,
  )

  const categories: GTDCategory[] = ["Inbox", "Próximas acciones", "Multitarea", "A la espera", "Algún día"]

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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar tareas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedCategory} onValueChange={(value: GTDCategory | "all") => setSelectedCategory(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todas las categorías" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedPriority} onValueChange={(value: Priority | "all") => setSelectedPriority(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todas las prioridades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las prioridades</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="media">Media</SelectItem>
                <SelectItem value="baja">Baja</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedContext} onValueChange={(value: string) => setSelectedContext(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los contextos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los contextos</SelectItem>
                {contexts.map((context) => (
                  <SelectItem key={context.id} value={context.id}>
                    {context.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant={showCompleted ? "default" : "outline"}
              onClick={() => setShowCompleted(!showCompleted)}
              className="w-full"
            >
              {showCompleted ? "Ocultar completadas" : "Mostrar completadas"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de tareas por categoría */}
      {selectedCategory === "all" ? (
        categories.map((category) => {
          const categoryTasks = groupedTasks[category] || []
          const Icon = CATEGORY_ICONS[category]

          if (categoryTasks.length === 0) return null

          return (
            <Card key={category} className="overflow-hidden">
              <CardHeader className={`bg-gradient-to-r ${CATEGORY_COLORS[category]} text-white`}>
                <CardTitle className="flex items-center justify-between font-heading">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    {category}
                  </div>
                  <Badge variant="secondary" className="bg-white/20 text-white">
                    {categoryTasks.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {categoryTasks.map((task) => (
                  <TaskItem key={task.id} task={task} onEdit={onEditTask} />
                ))}
              </CardContent>
            </Card>
          )
        })
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <TaskItem key={task.id} task={task} onEdit={onEditTask} />
          ))}
          {filteredTasks.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">No se encontraron tareas con los filtros aplicados.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

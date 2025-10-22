"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Inbox, ArrowRight, FolderOpen, Clock, Calendar, Search, Filter } from "lucide-react"
import type { Task, GTDCategory } from "@/types/task"
import { useTasks } from "@/hooks/use-tasks"
import TaskItem from "./task-item"
import { useContexts } from "@/hooks/use-contexts"
import { modernTheme } from "@/lib/theme"

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

const CATEGORY_STYLES = {
  Inbox: {
    card: `${modernTheme.colors.cardInbox} ${modernTheme.container.radius} ${modernTheme.container.shadowMd} border`,
    title: modernTheme.colors.textInbox,
    badge: `${modernTheme.colors.badgeInbox} ${modernTheme.container.radius}`,
  },
  "Próximas acciones": {
    card: `${modernTheme.colors.cardNext} ${modernTheme.container.radius} ${modernTheme.container.shadowMd} border`,
    title: modernTheme.colors.textNext,
    badge: `${modernTheme.colors.badgeNext} ${modernTheme.container.radius}`,
  },
  Multitarea: {
    card: `${modernTheme.colors.cardProject} ${modernTheme.container.radius} ${modernTheme.container.shadowMd} border`,
    title: modernTheme.colors.textProject,
    badge: `${modernTheme.colors.badgeProject} ${modernTheme.container.radius}`,
  },
  "A la espera": {
    card: `${modernTheme.colors.cardWaiting} ${modernTheme.container.radius} ${modernTheme.container.shadowMd} border`,
    title: modernTheme.colors.textWaiting,
    badge: `${modernTheme.colors.badgeWaiting} ${modernTheme.container.radius}`,
  },
  "Algún día": {
    card: `${modernTheme.colors.cardSomeday} ${modernTheme.container.radius} ${modernTheme.container.shadowMd} border`,
    title: modernTheme.colors.textSomeday,
    badge: `${modernTheme.colors.badgeSomeday} ${modernTheme.container.radius}`,
  },
}

export default function TaskList({ onEditTask }: TaskListProps) {
  const { tasks, loading } = useTasks()
  const { contexts } = useContexts()
  const [selectedCategory, setSelectedCategory] = useState<GTDCategory | "all">("all")
  const [selectedContext, setSelectedContext] = useState<string | "all">("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [showCompleted, setShowCompleted] = useState(false)

  const filteredTasks = tasks.filter((task) => {
    const matchesCategory = selectedCategory === "all" || task.category === selectedCategory
    const matchesContext = selectedContext === "all" || task.contextId === selectedContext
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCompleted = showCompleted || !task.completed

    return matchesCategory && matchesContext && matchesSearch && matchesCompleted
  })

  // Ordenar tareas por fecha: más reciente a más futura, sin fecha al final
  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      // Si ambas tienen fecha
      if (a.dueDate && b.dueDate) {
        return a.dueDate.getTime() - b.dueDate.getTime()
      }
      // Si solo 'a' tiene fecha, 'a' va primero
      if (a.dueDate && !b.dueDate) {
        return -1
      }
      // Si solo 'b' tiene fecha, 'b' va primero
      if (!a.dueDate && b.dueDate) {
        return 1
      }
      // Si ninguna tiene fecha, ordenar por fecha de creación (más reciente primero)
      return b.createdAt.getTime() - a.createdAt.getTime()
    })
  }, [filteredTasks])

  const groupedTasks = sortedTasks.reduce(
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
        <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${modernTheme.colors.primaryText}`}></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card className={`${modernTheme.effects.glass} ${modernTheme.container.shadow} border ${modernTheme.colors.cardBorder} ${modernTheme.container.radius} ${modernTheme.effects.transition}`}>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${modernTheme.typography.heading} ${modernTheme.colors.primaryText}`}>
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className={`absolute left-3 top-3 h-4 w-4 ${modernTheme.colors.muted}`} />
              <Input
                placeholder="Buscar tareas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-10 ${modernTheme.container.radius}`}
              />
            </div>

            <Select value={selectedCategory} onValueChange={(value: GTDCategory | "all") => setSelectedCategory(value)}>
              <SelectTrigger className={modernTheme.container.radius}>
                <SelectValue placeholder="Todas las categorías" />
              </SelectTrigger>
              <SelectContent className={`${modernTheme.effects.glass} border ${modernTheme.colors.cardBorder} ${modernTheme.container.shadow}`}>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedContext} onValueChange={(value: string) => setSelectedContext(value)}>
              <SelectTrigger className={modernTheme.container.radius}>
                <SelectValue placeholder="Todos los contextos" />
              </SelectTrigger>
              <SelectContent className={`${modernTheme.effects.glass} border ${modernTheme.colors.cardBorder} ${modernTheme.container.shadow}`}>
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
              className={`w-full ${modernTheme.container.radius}`}
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
          const styles = CATEGORY_STYLES[category]

          if (categoryTasks.length === 0) return null

          return (
            <Card key={category} className={`${styles.card} ${modernTheme.effects.glassHover} ${modernTheme.effects.transition} overflow-hidden`}>
              <CardHeader>
                <CardTitle className={`flex items-center justify-between ${modernTheme.typography.heading} ${styles.title}`}>
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    {category}
                  </div>
                  <Badge variant="secondary" className={styles.badge}>
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
          {sortedTasks.map((task) => (
            <TaskItem key={task.id} task={task} onEdit={onEditTask} />
          ))}
          {sortedTasks.length === 0 && (
            <Card className={`${modernTheme.effects.glass} ${modernTheme.container.shadow} border ${modernTheme.colors.cardBorder} ${modernTheme.container.radius}`}>
              <CardContent className="p-8 text-center">
                <p className={modernTheme.colors.mutedForeground}>No se encontraron tareas con los filtros aplicados.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

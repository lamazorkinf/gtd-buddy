"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CheckCircle, Clock, Edit, Trash2, CalendarIcon, ArrowRight, Plus, Inbox, FolderOpen } from "lucide-react"
import { format, subDays, isAfter } from "date-fns"
import { es } from "date-fns/locale"
import { useTasks } from "@/hooks/use-tasks"
import type { Task, GTDCategory, Priority } from "@/types/task"
import ModalTransition from "@/components/transitions/modal-transition"

interface EditableTaskProps {
  task: Task
  onUpdate: (taskId: string, updates: Partial<Task>) => void
  onDelete: (taskId: string) => void
  onMoveCategory: (taskId: string, category: GTDCategory) => void
}

function EditableTask({ task, onUpdate, onDelete, onMoveCategory }: EditableTaskProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    title: task.title,
    description: task.description || "",
    priority: task.priority,
    dueDate: task.dueDate,
  })

  const handleSave = () => {
    onUpdate(task.id, editData)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditData({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      dueDate: task.dueDate,
    })
    setIsEditing(false)
  }

  const PRIORITY_COLORS = {
    baja: "bg-green-100 text-green-800 border-green-300",
    media: "bg-yellow-100 text-yellow-800 border-yellow-300",
    alta: "bg-red-100 text-red-800 border-red-300",
  }

  const PRIORITY_ICONS = {
    baja: "🟢",
    media: "🟡",
    alta: "🔴",
  }

  const CATEGORY_COLORS = {
    Inbox: "bg-gray-100 text-gray-800",
    "Próximas acciones": "bg-blue-100 text-blue-800",
    Proyectos: "bg-purple-100 text-purple-800",
    "A la espera": "bg-orange-100 text-orange-800",
    "Algún día": "bg-green-100 text-green-800",
    Multitarea: "bg-pink-100 text-pink-800",
  }

  return (
    <Card className={`transition-all ${task.completed ? "opacity-60" : ""} hover:shadow-md`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="space-y-3">
                <Input
                  value={editData.title}
                  onChange={(e) => setEditData((prev) => ({ ...prev, title: e.target.value }))}
                  className="font-medium"
                />
                <Textarea
                  value={editData.description}
                  onChange={(e) => setEditData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Descripción..."
                  rows={2}
                />
                <div className="flex gap-2">
                  <Select
                    value={editData.priority}
                    onValueChange={(value: Priority) => setEditData((prev) => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baja">🟢 Baja</SelectItem>
                      <SelectItem value="media">🟡 Media</SelectItem>
                      <SelectItem value="alta">🔴 Alta</SelectItem>
                    </SelectContent>
                  </Select>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editData.dueDate ? format(editData.dueDate, "dd/MM", { locale: es }) : "Fecha"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={editData.dueDate}
                        onSelect={(date) => setEditData((prev) => ({ ...prev, dueDate: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSave} size="sm">
                    Guardar
                  </Button>
                  <Button onClick={handleCancel} variant="outline" size="sm">
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h4 className={`font-medium ${task.completed ? "line-through text-gray-500" : ""}`}>{task.title}</h4>
                </div>

                {task.description && (
                  <p className={`text-sm text-gray-600 mt-1 mb-3 ${task.completed ? "line-through" : ""}`}>
                    {task.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Badge variant="secondary" className={CATEGORY_COLORS[task.category]}>
                    {task.category}
                  </Badge>
                  <Badge variant="outline" className={PRIORITY_COLORS[task.priority]}>
                    {PRIORITY_ICONS[task.priority]} {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                  </Badge>
                  {task.dueDate && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      {format(task.dueDate, "dd MMM", { locale: es })}
                    </Badge>
                  )}
                </div>

                {/* Botones de acción directos */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => onUpdate(task.id, { completed: !task.completed })}
                    size="sm"
                    variant={task.completed ? "outline" : "default"}
                    className="text-xs"
                  >
                    {task.completed ? "Reactivar" : "Completar"}
                  </Button>

                  <Button onClick={() => setIsEditing(true)} size="sm" variant="outline" className="text-xs">
                    <Edit className="mr-1 h-3 w-3" />
                    Editar
                  </Button>

                  <Button
                    onClick={() => onMoveCategory(task.id, "Próximas acciones")}
                    size="sm"
                    variant="outline"
                    className="text-xs"
                  >
                    <ArrowRight className="mr-1 h-3 w-3" />A Próximas
                  </Button>

                  <Button
                    onClick={() => onMoveCategory(task.id, "A la espera")}
                    size="sm"
                    variant="outline"
                    className="text-xs"
                  >
                    <Clock className="mr-1 h-3 w-3" />A Espera
                  </Button>

                  <Button
                    onClick={() => onDelete(task.id)}
                    size="sm"
                    variant="outline"
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Eliminar
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface ReviewSectionProps {
  title: string
  description: string
  tasks: Task[]
  onUpdate: (taskId: string, updates: Partial<Task>) => void
  onDelete: (taskId: string) => void
  onMoveCategory: (taskId: string, category: GTDCategory) => void
  onAddTask?: (category: GTDCategory) => void
  category?: GTDCategory
  children?: React.ReactNode
  icon: React.ReactNode
  bgGradient: string
  borderColor: string
}

function ReviewSection({
  title,
  description,
  tasks,
  onUpdate,
  onDelete,
  onMoveCategory,
  onAddTask,
  category,
  children,
  icon,
  bgGradient,
  borderColor,
}: ReviewSectionProps) {
  const pendingTasks = tasks.filter((t) => !t.completed)
  const isCompleted = pendingTasks.length === 0

  return (
    <Card className={`${isCompleted ? "border-green-200 bg-green-50" : borderColor} transition-all duration-300`}>
      <CardHeader className={`${bgGradient} ${isCompleted ? "bg-green-50" : ""} transition-all duration-300`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <div className="flex items-center gap-3 flex-1">
              <div className="p-2 bg-white/50 rounded-lg">{icon}</div>
              <div className="flex-1">
                <CardTitle className="text-lg font-heading">{title}</CardTitle>
                <p className="text-sm text-gray-600 mt-1">{description}</p>
                {tasks.length > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="bg-white/50">
                      {pendingTasks.length} pendientes de {tasks.length} total
                    </Badge>
                    {isCompleted && tasks.length > 0 && (
                      <Badge className="bg-green-600 text-white">✅ Completado</Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {category && onAddTask && (
              <Button
                onClick={() => onAddTask(category)}
                size="sm"
                variant="outline"
                className="flex items-center gap-1 bg-white/50 hover:bg-white/80"
              >
                <Plus className="h-4 w-4" />
                Añadir
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Mostrar contenido solo si hay tareas */}
      {tasks.length > 0 && (
        <CardContent className="pt-4">
          {children}

          <div className="space-y-3 mt-4">
            {tasks.map((task) => (
              <EditableTask
                key={task.id}
                task={task}
                onUpdate={onUpdate}
                onDelete={onDelete}
                onMoveCategory={onMoveCategory}
              />
            ))}
          </div>
        </CardContent>
      )}

      {/* Mensaje cuando no hay tareas */}
      {tasks.length === 0 && (
        <CardContent className="pt-4">
          <div className="text-center py-4 text-gray-500">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p>¡Excelente! No hay elementos en esta categoría.</p>
          </div>
        </CardContent>
      )}
    </Card>
  )
}

export default function WeeklyReviewComponent() {
  const [showNewTaskForm, setShowNewTaskForm] = useState<GTDCategory | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState("")

  const { tasks, updateTask, deleteTask, addTask } = useTasks()

  // Análisis de tareas para la revisión
  const inboxTasks = tasks.filter((task) => task.category === "Inbox")
  const multitaskTasks = tasks.filter((task) => task.category === "Multitarea")
  const waitingTasks = tasks.filter((task) => task.category === "A la espera")
  const somedayTasks = tasks.filter((task) => task.category === "Algún día")
  const nextActionTasks = tasks.filter((task) => task.category === "Próximas acciones")

  // Tareas sin revisar en más de una semana
  const weekAgo = subDays(new Date(), 7)
  const staleMultitasks = multitaskTasks.filter((task) => !task.lastReviewed || isAfter(weekAgo, task.lastReviewed))
  const overdueTasks = tasks.filter((task) => task.dueDate && task.dueDate < new Date() && !task.completed)

  // Calcular progreso automáticamente
  const sections = [
    { name: "inbox", tasks: inboxTasks },
    { name: "multitasks", tasks: staleMultitasks },
    { name: "waiting", tasks: waitingTasks.filter((t) => !t.completed) },
    { name: "someday", tasks: somedayTasks },
  ]

  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    try {
      await updateTask(taskId, { ...updates, lastReviewed: new Date() })
    } catch (error) {
      console.error("Error al actualizar tarea:", error)
    }
  }

  const handleTaskDelete = async (taskId: string) => {
    if (confirm("¿Eliminar esta tarea? No se puede deshacer.")) {
      try {
        await deleteTask(taskId)
      } catch (error) {
        console.error("Error al eliminar tarea:", error)
      }
    }
  }

  const handleMoveCategory = async (taskId: string, category: GTDCategory) => {
    try {
      await updateTask(taskId, { category, lastReviewed: new Date() })
    } catch (error) {
      console.error("Error al mover tarea:", error)
    }
  }

  const handleAddTask = async (category: GTDCategory) => {
    if (!newTaskTitle.trim()) return

    try {
      await addTask({
        title: newTaskTitle,
        category,
        priority: "media",
        completed: false,
        lastReviewed: new Date(),
      })
      setNewTaskTitle("")
      setShowNewTaskForm(null)
    } catch (error) {
      console.error("Error al crear tarea:", error)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header con progreso visual */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold font-heading bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Revisión Semanal GTD
        </h1>
        <p className="text-lg text-gray-600">Revisa y actualiza tu sistema para mantener el control total</p>
        <Badge variant="outline" className="text-lg px-4 py-2">
          📅 {format(new Date(), "dd 'de' MMMM, yyyy", { locale: es })}
        </Badge>
      </div>

      {/* Estadísticas con iconos */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card
          className={`${inboxTasks.length > 0 ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"} transition-all`}
        >
          <CardContent className="p-4 text-center">
            <div className="text-3xl mb-2">📥</div>
            <div className="text-2xl font-bold">{inboxTasks.length}</div>
            <div className="text-sm text-gray-600">En Inbox</div>
          </CardContent>
        </Card>

        <Card
          className={`${staleMultitasks.length > 0 ? "border-orange-200 bg-orange-50" : "border-green-200 bg-green-50"} transition-all`}
        >
          <CardContent className="p-4 text-center">
            <div className="text-3xl mb-2">📂</div>
            <div className="text-2xl font-bold">{staleMultitasks.length}</div>
            <div className="text-sm text-gray-600">Multitareas sin revisar</div>
          </CardContent>
        </Card>

        <Card
          className={`${overdueTasks.length > 0 ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"} transition-all`}
        >
          <CardContent className="p-4 text-center">
            <div className="text-3xl mb-2">⚠️</div>
            <div className="text-2xl font-bold">{overdueTasks.length}</div>
            <div className="text-sm text-gray-600">Tareas vencidas</div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4 text-center">
            <div className="text-3xl mb-2">✅</div>
            <div className="text-2xl font-bold">{nextActionTasks.filter((t) => !t.completed).length}</div>
            <div className="text-sm text-gray-600">Próximas acciones</div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 text-center">
            <div className="text-3xl mb-2">✔️</div>
            <div className="text-2xl font-bold">{tasks.filter((t) => t.completed).length}</div>
            <div className="text-sm text-gray-600">Completadas</div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas importantes */}
      {overdueTasks.length > 0 && (
        <Card className="border-red-200 bg-gradient-to-r from-red-50 to-red-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🚨</div>
              <div>
                <span className="font-semibold text-red-800">
                  Tienes {overdueTasks.length} tareas vencidas que requieren atención inmediata
                </span>
                <p className="text-sm text-red-600 mt-1">
                  Revísalas y actualiza sus fechas o márcalas como completadas.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Secciones de revisión simplificadas */}
      <div className="space-y-6">
        {/* 1. Procesar Inbox */}
        <ReviewSection
          title="1. Procesar Inbox completamente"
          description="Aclara y organiza todas las tareas capturadas durante la semana."
          tasks={inboxTasks}
          onUpdate={handleTaskUpdate}
          onDelete={handleTaskDelete}
          onMoveCategory={handleMoveCategory}
          icon={<Inbox className="h-6 w-6 text-gray-700" />}
          bgGradient="bg-gradient-to-r from-gray-50 to-slate-100"
          borderColor="border-gray-200"
        >
          {inboxTasks.length > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
              <p className="text-sm text-blue-700">
                💡 <strong>Para cada elemento:</strong> ¿Es accionable? ¿Cuál es el próximo paso específico? ¿Puedo
                hacerlo en menos de 2 minutos?
              </p>
            </div>
          )}
        </ReviewSection>

        {/* 2. Revisar Proyectos */}
        <ReviewSection
          title="2. Revisar todas las Multitareas"
          description="Verifica el progreso y define las siguientes acciones para cada multitarea."
          tasks={staleMultitasks}
          onUpdate={handleTaskUpdate}
          onDelete={handleTaskDelete}
          onMoveCategory={handleMoveCategory}
          onAddTask={(category) => setShowNewTaskForm(category)}
          category="Multitarea"
          icon={<FolderOpen className="h-6 w-6 text-purple-700" />}
          bgGradient="bg-gradient-to-r from-purple-50 to-purple-100"
          borderColor="border-purple-200"
        >
          {staleMultitasks.length > 0 && (
            <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-400">
              <p className="text-sm text-orange-700">
                ⚠️ <strong>{staleMultitasks.length} proyectos</strong> no han sido revisados en más de una semana.
              </p>
            </div>
          )}
        </ReviewSection>

        {/* 3. Actualizar "A la espera" */}
        <ReviewSection
          title="3. Actualizar lista 'A la espera'"
          description="Revisa qué respuestas has recibido y qué seguimientos necesitas hacer."
          tasks={waitingTasks.filter((t) => !t.completed)}
          onUpdate={handleTaskUpdate}
          onDelete={handleTaskDelete}
          onMoveCategory={handleMoveCategory}
          onAddTask={(category) => setShowNewTaskForm(category)}
          category="A la espera"
          icon={<Clock className="h-6 w-6 text-orange-700" />}
          bgGradient="bg-gradient-to-r from-orange-50 to-orange-100"
          borderColor="border-orange-200"
        >
          <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
            <p className="text-sm text-yellow-700">
              📞 <strong>Pregúntate:</strong> ¿He recibido respuesta? ¿Necesito hacer seguimiento? ¿Puedo mover esto a
              próximas acciones?
            </p>
          </div>
        </ReviewSection>

        {/* 4. Revisar "Algún día" */}
        <ReviewSection
          title="4. Revisar lista 'Algún día/Quizá'"
          description="Evalúa si alguna idea ahora es relevante y debe moverse a acciones activas."
          tasks={somedayTasks}
          onUpdate={handleTaskUpdate}
          onDelete={handleTaskDelete}
          onMoveCategory={handleMoveCategory}
          onAddTask={(category) => setShowNewTaskForm(category)}
          category="Algún día"
          icon={<CalendarIcon className="h-6 w-6 text-green-700" />}
          bgGradient="bg-gradient-to-r from-green-50 to-green-100"
          borderColor="border-green-200"
        >
          <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
            <p className="text-sm text-green-700">
              🌱 <strong>Considera:</strong> ¿Alguna de estas ideas ahora es prioritaria? ¿Hay algo que ya no me
              interesa y puedo eliminar?
            </p>
          </div>
        </ReviewSection>
      </div>

      {/* Modal para añadir nueva tarea con nueva transición */}
      <ModalTransition
        isOpen={showNewTaskForm !== null}
        onClose={() => {
          setShowNewTaskForm(null)
          setNewTaskTitle("")
        }}
      >
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Añadir a {showNewTaskForm}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Título de la nueva tarea..."
              onKeyPress={(e) => e.key === "Enter" && showNewTaskForm && handleAddTask(showNewTaskForm)}
              autoFocus
            />
            <div className="flex gap-2">
              <Button onClick={() => showNewTaskForm && handleAddTask(showNewTaskForm)} className="flex-1">
                Añadir
              </Button>
              <Button
                onClick={() => {
                  setShowNewTaskForm(null)
                  setNewTaskTitle("")
                }}
                variant="outline"
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      </ModalTransition>
    </div>
  )
}

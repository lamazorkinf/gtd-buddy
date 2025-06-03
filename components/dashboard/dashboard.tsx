"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Plus,
  LogOut,
  User,
  Calendar,
  Inbox,
  ArrowRight,
  FolderOpen,
  Clock,
  Lightbulb,
  RotateCcw,
  Target,
  Settings,
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { useTasks } from "@/hooks/use-tasks"
import type { Task } from "@/types/task"
import TaskForm from "@/components/tasks/task-form"
import TaskList from "@/components/tasks/task-list"
import QuickCapture from "@/components/gtd/quick-capture"
import InboxProcessor from "@/components/gtd/inbox-processor"
import WeeklyReviewComponent from "@/components/gtd/weekly-review"
import { useContexts } from "@/hooks/use-contexts"
import ModalTransition from "@/components/transitions/modal-transition"
import { format } from "date-fns"

export default function Dashboard() {
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | undefined>()
  const [activeTab, setActiveTab] = useState("overview")
  const { user, signOut } = useAuth()
  const { contexts } = useContexts()
  const { tasks, updateTask } = useTasks()

  // Análisis GTD
  const inboxTasks = tasks.filter((task) => task.category === "Inbox")
  const todayTasks = tasks.filter(
    (task) => task.dueDate && task.dueDate.toDateString() === new Date().toDateString() && !task.completed,
  )
  const overdueTasks = tasks.filter((task) => task.dueDate && task.dueDate < new Date() && !task.completed)

  // IDs de tareas que ya están en "Para hoy" o "Urgente" para excluirlas de "Próximas acciones"
  const excludedTaskIds = new Set([...todayTasks.map((task) => task.id), ...overdueTasks.map((task) => task.id)])

  // Próximas acciones filtradas (excluyendo las que ya están en otras categorías)
  const nextActionTasks = tasks.filter(
    (task) => task.category === "Próximas acciones" && !task.completed && !excludedTaskIds.has(task.id),
  )

  const multitaskTasks = tasks.filter((task) => task.category === "Multitarea" && !task.completed)
  const waitingTasks = tasks.filter((task) => task.category === "A la espera" && !task.completed)
  const somedayTasks = tasks.filter((task) => task.category === "Algún día")

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setShowTaskForm(true)
  }

  const handleCloseForm = () => {
    setShowTaskForm(false)
    setEditingTask(undefined)
  }

  const handleToggleComplete = async (taskId: string, completed: boolean) => {
    try {
      await updateTask(taskId, { completed: !completed })
    } catch (error) {
      console.error("Error al actualizar tarea:", error)
    }
  }

  const handleGoToOrganize = () => {
    setActiveTab("organize")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-red-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Link href="/">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-heading cursor-pointer">
                  GTD Buddy
                </h1>
              </Link>
            </div>

            <div className="flex items-center gap-4">
              {/* Botón de Contextos */}
              <Link href="/contexts">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  <span className="hidden sm:inline">Contextos</span>
                  <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
                    {contexts.filter((c) => c.status === "active" || !c.status).length}
                  </Badge>
                </Button>
              </Link>

              {/* Botón de Calendario */}
              <Link href="/calendar">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">Calendario</span>
                </Button>
              </Link>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{user?.displayName || user?.email}</span>
              </div>
              <Button variant="outline" size="sm" onClick={signOut} className="flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Salir</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Captura Rápida - Siempre visible */}
        <div className="mb-8">
          <QuickCapture />
        </div>

        {/* Navegación GTD - Solo las pestañas del flujo GTD */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <ArrowRight className="h-4 w-4" />
              <span className="hidden sm:inline">Hacer</span>
            </TabsTrigger>
            <TabsTrigger value="inbox" className="flex items-center gap-2">
              <Inbox className="h-4 w-4" />
              <span className="hidden sm:inline">Procesar</span>
              {inboxTasks.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 text-xs">
                  {inboxTasks.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="organize" className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Organizar</span>
            </TabsTrigger>
            <TabsTrigger value="review" className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">Revisar</span>
            </TabsTrigger>
            <TabsTrigger value="capture" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              <span className="hidden sm:inline">Capturar</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab: Hacer (Overview enfocado en acción) */}
          <TabsContent value="overview" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 font-heading">¿Qué Hacer Ahora?</h2>
              <Button
                onClick={() => setShowTaskForm(true)}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <Plus className="mr-2 h-4 w-4" />
                Nueva Tarea
              </Button>
            </div>

            {/* Alertas importantes */}
            {inboxTasks.length > 0 && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Inbox className="h-5 w-5 text-red-600" />
                      <span className="font-semibold text-red-800">
                        Tienes {inboxTasks.length} elementos sin procesar en tu Inbox
                      </span>
                    </div>
                    <Button onClick={() => setActiveTab("inbox")} size="sm" className="bg-red-600 hover:bg-red-700">
                      Procesar Ahora
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Vista enfocada en acción */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Tareas de hoy */}
              <Card className="border-blue-200">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-blue-800 mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Para Hoy ({todayTasks.length})
                  </h3>
                  <div className="space-y-2">
                    {todayTasks.slice(0, 5).map((task) => (
                      <div
                        key={task.id}
                        className="p-2 bg-blue-50 rounded border-l-4 border-blue-400 flex items-start gap-2"
                      >
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={() => handleToggleComplete(task.id, task.completed)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-sm flex justify-between">
                            <span>{task.title}</span>
                            {task.dueDate && (
                              <span className="text-xs text-blue-600 font-mono">{format(task.dueDate, "HH:mm")}</span>
                            )}
                          </div>
                          <div className="text-xs text-blue-600">{task.category}</div>
                        </div>
                      </div>
                    ))}
                    {todayTasks.length === 0 && (
                      <p className="text-sm text-gray-500">No hay tareas programadas para hoy</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Próximas acciones */}
              <Card className="border-green-200">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-green-800 mb-4 flex items-center gap-2">
                    <ArrowRight className="h-5 w-5" />
                    Próximas Acciones ({nextActionTasks.length})
                  </h3>
                  <div className="space-y-2">
                    {nextActionTasks.slice(0, 5).map((task) => (
                      <div
                        key={task.id}
                        className="p-2 bg-green-50 rounded border-l-4 border-green-400 flex items-start gap-2"
                      >
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={() => handleToggleComplete(task.id, task.completed)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-sm flex justify-between">
                            <span>{task.title}</span>
                            {task.dueDate && (
                              <span className="text-xs text-green-600 font-mono">{format(task.dueDate, "HH:mm")}</span>
                            )}
                          </div>
                          <div className="text-xs text-green-600">Prioridad: {task.priority}</div>
                        </div>
                      </div>
                    ))}
                    {nextActionTasks.length === 0 && (
                      <p className="text-sm text-gray-500">No hay próximas acciones definidas</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Vencidas/Urgentes */}
              <Card className="border-red-200">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-red-800 mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Urgente ({overdueTasks.length})
                  </h3>
                  <div className="space-y-2">
                    {overdueTasks.slice(0, 5).map((task) => (
                      <div key={task.id} className="space-y-2">
                        <div className="p-2 bg-red-50 rounded border-l-4 border-red-400 flex items-start gap-2">
                          <Checkbox
                            checked={task.completed}
                            onCheckedChange={() => handleToggleComplete(task.id, task.completed)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-sm flex justify-between">
                              <span>{task.title}</span>
                              {task.dueDate && (
                                <span className="text-xs text-red-600 font-mono">{format(task.dueDate, "HH:mm")}</span>
                              )}
                            </div>
                            <div className="text-xs text-red-600">Vencida: {task.dueDate?.toLocaleDateString()}</div>
                          </div>
                        </div>
                        <Button
                          onClick={handleGoToOrganize}
                          size="sm"
                          variant="outline"
                          className="w-full text-xs border-red-300 text-red-700 hover:bg-red-50"
                        >
                          <Settings className="mr-1 h-3 w-3" />
                          Ir a Organizar
                        </Button>
                      </div>
                    ))}
                    {overdueTasks.length === 0 && <p className="text-sm text-gray-500">¡No hay tareas vencidas!</p>}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Resumen de categorías */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Card className="text-center">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-purple-600">{multitaskTasks.length}</div>
                  <div className="text-sm text-gray-600">Multitarea</div>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-orange-600">{waitingTasks.length}</div>
                  <div className="text-sm text-gray-600">En Espera</div>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-green-600">{somedayTasks.length}</div>
                  <div className="text-sm text-gray-600">Algún Día</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab: Procesar Inbox */}
          <TabsContent value="inbox">
            {inboxTasks.length > 0 ? (
              <InboxProcessor inboxTasks={inboxTasks} />
            ) : (
              <Card className="text-center">
                <CardContent className="p-8">
                  <Inbox className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-green-700 mb-2 font-heading">¡Inbox Limpio!</h3>
                  <p className="text-gray-600">
                    Todas las tareas han sido procesadas y organizadas. Usa la captura rápida para añadir nuevas ideas.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab: Organizar */}
          <TabsContent value="organize">
            <TaskList onEditTask={handleEditTask} />
          </TabsContent>

          {/* Tab: Revisar */}
          <TabsContent value="review">
            <WeeklyReviewComponent />
          </TabsContent>

          {/* Tab: Capturar */}
          <TabsContent value="capture" className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold font-heading mb-4">Captura Todo lo que Tienes en Mente</h2>
              <p className="text-gray-600 mb-8">
                El primer paso del GTD: libera tu mente anotando todas las tareas, ideas y responsabilidades.
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
              <QuickCapture />

              <Card className="mt-6">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 font-heading">Tips para una Captura Efectiva:</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>
                      • <strong>Anota todo:</strong> No filtres, solo captura cada pensamiento
                    </li>
                    <li>
                      • <strong>Sé específico:</strong> "Llamar a Juan sobre el proyecto" vs "Llamar a Juan"
                    </li>
                    <li>
                      • <strong>Una idea por tarea:</strong> Divide ideas complejas en elementos separados
                    </li>
                    <li>
                      • <strong>No organices ahora:</strong> Solo captura, organizarás después
                    </li>
                    <li>
                      • <strong>Usa siempre el mismo lugar:</strong> Tu Inbox es tu contenedor confiable
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Task Form Modal con nueva transición */}
        <ModalTransition isOpen={showTaskForm} onClose={handleCloseForm}>
          <TaskForm task={editingTask} onClose={handleCloseForm} />
        </ModalTransition>
      </main>
    </div>
  )
}

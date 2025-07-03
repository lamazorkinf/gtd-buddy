"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, LogOut, Calendar, ArrowRight, Clock, Layers, Hourglass, CalendarClock, User } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { useTasks } from "@/hooks/use-tasks"
import { useContexts } from "@/hooks/use-contexts"
import type { Task, Subtask } from "@/types/task"
import TaskForm from "@/components/tasks/task-form"
import TaskList from "@/components/tasks/task-list"
import QuickCapture from "@/components/gtd/quick-capture"
import InboxProcessor from "@/components/gtd/inbox-processor"
import ModalTransition from "@/components/transitions/modal-transition"
import { isValid, isBefore, startOfDay, addDays, isSameDay, isAfter } from "date-fns"
import { AnimatePresence } from "framer-motion"
import { DashboardPanel } from "./dashboard-panel"

const safeDate = (value: unknown): Date | undefined => {
  if (!value) return undefined
  if (typeof value === "object" && value !== null && "toDate" in value) {
    try {
      return (value as any).toDate()
    } catch {
      return undefined
    }
  }
  if (value instanceof Date) {
    return isValid(value) ? value : undefined
  }
  try {
    const date = new Date(value as string | number)
    return isValid(date) ? date : undefined
  } catch {
    return undefined
  }
}

type DisplayableItem = (Task & { itemType: "task" }) | (Subtask & { itemType: "subtask"; parentTask: Task })

export default function Dashboard() {
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | undefined>()
  const [activeTab, setActiveTab] = useState("overview")
  const [showTestWelcome, setShowTestWelcome] = useState(false)
  const [expandedPanel, setExpandedPanel] = useState<string | null>(null)
  const [selectedContexts, setSelectedContexts] = useState<string[]>([])
  const { user, subscriptionStatus, signOut } = useAuth()
  const { tasks, updateTask } = useTasks()
  const { contexts } = useContexts()
  const router = useRouter()

  const [todayItems, setTodayItems] = useState<DisplayableItem[]>([])
  const [overdueItems, setOverdueItems] = useState<DisplayableItem[]>([])
  const [thisWeekItems, setThisWeekItems] = useState<DisplayableItem[]>([])

  useEffect(() => {
    if (!user) {
      router.replace("/auth")
      return
    }
    if (!subscriptionStatus.canAccessDashboard) {
      router.replace("/subscription")
    }
  }, [user, subscriptionStatus, router])

  // Filtrar tareas por contextos seleccionados
  const filterTasksByContext = (taskList: Task[]) => {
    if (selectedContexts.length === 0) return taskList
    return taskList.filter((task) => !task.contextId || selectedContexts.includes(task.contextId))
  }

  useEffect(() => {
    const today = startOfDay(new Date())
    const tomorrow = addDays(today, 1)
    const nextWeek = addDays(today, 8)

    const newTodayItems: DisplayableItem[] = []
    const newOverdueItems: DisplayableItem[] = []
    const newThisWeekItems: DisplayableItem[] = []

    // Filtrar tareas por contexto antes de procesarlas
    const filteredTasks = filterTasksByContext(tasks)

    filteredTasks.forEach((task) => {
      const processItem = (item: Task | Subtask, itemType: "task" | "subtask") => {
        if (item.completed) return
        const dueDate = item.dueDate ? startOfDay(safeDate(item.dueDate)!) : null
        if (!dueDate) return

        const displayItem: DisplayableItem =
          itemType === "task"
            ? { ...(item as Task), itemType: "task" }
            : { ...(item as Subtask), itemType: "subtask", parentTask: task }

        if (isSameDay(dueDate, today)) {
          newTodayItems.push(displayItem)
        } else if (isBefore(dueDate, today)) {
          newOverdueItems.push(displayItem)
        } else if (isAfter(dueDate, today) && isBefore(dueDate, nextWeek)) {
          newThisWeekItems.push(displayItem)
        }
      }

      processItem(task, "task")
      task.subtasks?.forEach((subtask) => processItem(subtask, "subtask"))
    })

    const sortByDueDate = (a: DisplayableItem, b: DisplayableItem) => {
      const dateA = safeDate(a.dueDate)
      const dateB = safeDate(b.dueDate)
      if (!dateA) return 1
      if (!dateB) return -1
      return dateA.getTime() - dateB.getTime()
    }

    setTodayItems(newTodayItems.sort(sortByDueDate))
    setOverdueItems(newOverdueItems.sort(sortByDueDate))
    setThisWeekItems(newThisWeekItems.sort(sortByDueDate))
  }, [tasks, selectedContexts])

  const handleToggleComplete = async (taskId: string, completed: boolean) => {
    try {
      await updateTask(taskId, { completed: !completed })
    } catch (error) {
      console.error("Error al actualizar tarea:", error)
    }
  }

  const handleToggleSubtask = async (taskId: string, subtaskId: string) => {
    const task = tasks.find((t) => t.id === taskId)
    if (!task?.subtasks) return
    const updatedSubtasks = task.subtasks.map((st) => (st.id === subtaskId ? { ...st, completed: !st.completed } : st))
    try {
      await updateTask(taskId, { subtasks: updatedSubtasks })
    } catch (error) {
      console.error("Error al actualizar subtarea:", error)
    }
  }

  const handlePanelClick = (panelId: string) => {
    setExpandedPanel((prev) => (prev === panelId ? null : panelId))
  }

  const handleContextToggle = (contextId: string) => {
    setSelectedContexts((prev) =>
      prev.includes(contextId) ? prev.filter((id) => id !== contextId) : [...prev, contextId],
    )
  }

  const handleSelectAllContexts = () => {
    setSelectedContexts([])
  }

  const inboxTasks = tasks.filter((task) => task.category === "Inbox")
  const filteredTasks = filterTasksByContext(tasks)
  const nextActionTasks = filteredTasks.filter((task) => task.category === "Próximas acciones" && !task.completed)
  const multitaskTasks = filteredTasks.filter((task) => task.category === "Multitarea" && !task.completed)
  const waitingTasks = filteredTasks.filter((task) => task.category === "A la espera" && !task.completed)

  const renderUnifiedItem = (item: DisplayableItem, index: number) => {
    const handleItemToggle = (e: React.MouseEvent) => {
      e.stopPropagation()
      if (item.itemType === "task") {
        handleToggleComplete(item.id, item.completed)
      } else {
        handleToggleSubtask(item.parentTask.id, item.id)
      }
    }

    // Generar key única combinando tipo, id y índice para evitar duplicados
    const uniqueKey = `${item.itemType}-${item.id || "no-id"}-${index}`

    return (
      <div
        key={uniqueKey}
        className="p-2 bg-white/50 rounded border-l-4 border-gray-400 flex items-start gap-3 hover:bg-white/80 transition-colors"
        onClick={handleItemToggle}
      >
        <Checkbox checked={item.completed} className="mt-1" />
        <div className="flex-1">
          <span className={`font-medium text-sm break-words ${item.completed ? "line-through text-gray-500" : ""}`}>
            {item.title}
          </span>
          {item.itemType === "subtask" && <div className="text-xs text-gray-500">en: {item.parentTask.title}</div>}
        </div>
      </div>
    )
  }

  const renderTaskItem = (task: Task, index: number) => {
    // Generar key única con índice para evitar duplicados
    const uniqueKey = `task-${task.id || "no-id"}-${index}`

    return (
      <div
        key={uniqueKey}
        className="p-2 bg-white/50 rounded border-l-4 border-gray-300 flex items-start gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <Checkbox
          checked={task.completed}
          onCheckedChange={() => handleToggleComplete(task.id, task.completed)}
          onClick={(e) => e.stopPropagation()}
          className="mt-1"
        />
        <div className="flex-1">
          <span className="font-medium text-sm break-words">{task.title}</span>
        </div>
      </div>
    )
  }

  if (!user || !subscriptionStatus.canAccessDashboard) {
    return null
  }

  return (
    <div className="gtd-gradient-bg w-full max-w-7xl mx-auto flex flex-col h-screen">
      <header className="bg-white/90 backdrop-blur-sm shadow-sm border-b border-gtd-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gtd-clarity-400 to-gtd-action-400 bg-clip-text text-transparent font-heading">
                GTD Buddy
              </h1>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/calendar">
                <Button variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
                  <Calendar className="h-4 w-4" /> <span className="hidden sm:inline">Calendario</span>
                </Button>
              </Link>
              <Link href="/profile">
                <Button variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
                  <User className="h-4 w-4" /> <span className="hidden sm:inline">Perfil</span>
                </Button>
              </Link>
              {/* Botón de Nueva Tarea en el header */}
              <Button
                onClick={() => setShowTaskForm(true)}
                size="sm"
                className="gtd-gradient-action text-white flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Nueva Tarea</span>
              </Button>
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <QuickCapture />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">⚡ Hacer</TabsTrigger>
              <TabsTrigger value="inbox">
                📥 Bandeja de Entrada {inboxTasks.length > 0 && <Badge className="ml-2">{inboxTasks.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="organize">📂 Organizar</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Filtros por contexto */}
              {contexts.length > 0 && (
                <div className="bg-white/50 rounded-lg p-3 border border-gray-200">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant={selectedContexts.length === 0 ? "default" : "outline"}
                      size="sm"
                      onClick={handleSelectAllContexts}
                      className="h-7 px-3 text-xs"
                    >
                      Todos
                    </Button>
                    {contexts.map((context) => (
                      <Button
                        key={context.id}
                        variant={selectedContexts.includes(context.id) ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleContextToggle(context.id)}
                        className="h-7 px-3 text-xs"
                      >
                        {context.name}
                      </Button>
                    ))}
                  </div>
                  {selectedContexts.length > 0 && (
                    <div className="mt-2 text-xs text-gray-500">
                      Mostrando tareas de:{" "}
                      {selectedContexts.map((id) => contexts.find((c) => c.id === id)?.name).join(", ")}
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-6">
                {/* Top Row - Always Visible Content */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="bg-blue-50 border-blue-200 flex flex-col">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between text-base font-semibold text-blue-800">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-5 w-5" /> Para Hoy
                        </div>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          {todayItems.length}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow overflow-hidden">
                      <div className="space-y-2 h-full max-h-96 overflow-y-auto pr-2">
                        {todayItems.length > 0 ? (
                          todayItems.map((item, index) => renderUnifiedItem(item, index))
                        ) : (
                          <p className="text-sm text-gray-500 p-2">Nada para hoy. ¡Disfruta!</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-red-50 border-red-200 flex flex-col">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between text-base font-semibold text-red-800">
                        <div className="flex items-center gap-2">
                          <Clock className="h-5 w-5" /> Urgente
                        </div>
                        <Badge variant="secondary" className="bg-red-100 text-red-800">
                          {overdueItems.length}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow overflow-hidden">
                      <div className="space-y-2 h-full max-h-96 overflow-y-auto pr-2">
                        {overdueItems.length > 0 ? (
                          overdueItems.map((item, index) => renderUnifiedItem(item, index))
                        ) : (
                          <p className="text-sm text-gray-500 p-2">¡Sin tareas vencidas!</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-yellow-50 border-yellow-200 flex flex-col">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between text-base font-semibold text-yellow-800">
                        <div className="flex items-center gap-2">
                          <CalendarClock className="h-5 w-5" /> Esta Semana
                        </div>
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          {thisWeekItems.length}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow overflow-hidden">
                      <div className="space-y-2 h-full max-h-96 overflow-y-auto pr-2">
                        {thisWeekItems.length > 0 ? (
                          thisWeekItems.map((item, index) => renderUnifiedItem(item, index))
                        ) : (
                          <p className="text-sm text-gray-500 p-2">Planifica tu semana.</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Bottom Row - Expandable Panels */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                  <AnimatePresence>
                    {!expandedPanel || expandedPanel === "nextActions" ? (
                      <DashboardPanel
                        key="nextActions-panel"
                        panelId="nextActions"
                        title="Próximas Acciones"
                        icon={<ArrowRight className="h-5 w-5" />}
                        count={nextActionTasks.length}
                        expandedPanel={expandedPanel}
                        onPanelClick={handlePanelClick}
                        cardClassName="bg-green-50 border-green-200"
                        titleClassName="text-green-800"
                        badgeClassName="bg-green-100 text-green-800"
                      >
                        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                          {nextActionTasks.length > 0 ? (
                            nextActionTasks.map((task, index) => renderTaskItem(task, index))
                          ) : (
                            <p className="text-sm text-gray-500 p-2">Define tus próximas acciones.</p>
                          )}
                        </div>
                      </DashboardPanel>
                    ) : null}

                    {!expandedPanel || expandedPanel === "multitask" ? (
                      <DashboardPanel
                        key="multitask-panel"
                        panelId="multitask"
                        title="Multitarea"
                        icon={<Layers className="h-5 w-5" />}
                        count={multitaskTasks.length}
                        expandedPanel={expandedPanel}
                        onPanelClick={handlePanelClick}
                        cardClassName="bg-purple-50 border-purple-200"
                        titleClassName="text-purple-800"
                        badgeClassName="bg-purple-100 text-purple-800"
                      >
                        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                          {multitaskTasks.length > 0 ? (
                            multitaskTasks.map((task, index) => renderTaskItem(task, index))
                          ) : (
                            <p className="text-sm text-gray-500 p-2">No hay proyectos activos.</p>
                          )}
                        </div>
                      </DashboardPanel>
                    ) : null}

                    {!expandedPanel || expandedPanel === "waiting" ? (
                      <DashboardPanel
                        key="waiting-panel"
                        panelId="waiting"
                        title="En Espera"
                        icon={<Hourglass className="h-5 w-5" />}
                        count={waitingTasks.length}
                        expandedPanel={expandedPanel}
                        onPanelClick={handlePanelClick}
                        cardClassName="bg-orange-50 border-orange-200"
                        titleClassName="text-orange-800"
                        badgeClassName="bg-orange-100 text-orange-800"
                      >
                        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                          {waitingTasks.length > 0 ? (
                            waitingTasks.map((task, index) => renderTaskItem(task, index))
                          ) : (
                            <p className="text-sm text-gray-500 p-2">Nada en espera de momento.</p>
                          )}
                        </div>
                      </DashboardPanel>
                    ) : null}
                  </AnimatePresence>
                </div>
              </div>
            </TabsContent>

            {/* Other Tabs */}
            <TabsContent value="inbox">
              <InboxProcessor inboxTasks={inboxTasks} />
            </TabsContent>
            <TabsContent value="organize">
              <TaskList
                onEditTask={(task) => {
                  setShowTaskForm(true)
                  setEditingTask(task)
                }}
              />
            </TabsContent>
          </Tabs>

          <ModalTransition
            isOpen={showTaskForm}
            onClose={() => {
              setShowTaskForm(false)
              setEditingTask(undefined)
            }}
          >
            <TaskForm
              task={editingTask}
              onClose={() => {
                setShowTaskForm(false)
                setEditingTask(undefined)
              }}
            />
          </ModalTransition>
        </div>
      </main>
    </div>
  )
}

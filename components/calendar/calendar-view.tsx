"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronLeft, ChevronRight, Plus, CalendarIcon, Grid3X3, GridIcon, Edit } from "lucide-react" // Renamed Grid to GridIcon
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  getWeek,
} from "date-fns"
import { es } from "date-fns/locale"
import type { Task } from "@/types/task"
import { useTasks } from "@/hooks/use-tasks"
import { motion, AnimatePresence } from "framer-motion"

const PRIORITY_STYLES = {
  baja: {
    bg: "bg-gtd-confidence-500",
    border: "border-gtd-confidence-500",
    text: "text-gtd-confidence-700",
    badgeBg: "bg-gtd-confidence-100",
    badgeBorder: "border-gtd-confidence-300",
  },
  media: {
    bg: "bg-yellow-500",
    border: "border-yellow-500",
    text: "text-yellow-700",
    badgeBg: "bg-yellow-100",
    badgeBorder: "border-yellow-300",
  }, // Kept yellow for media as it's distinct
  alta: {
    bg: "bg-gtd-action-500",
    border: "border-gtd-action-500",
    text: "text-gtd-action-700",
    badgeBg: "bg-gtd-action-100",
    badgeBorder: "border-gtd-action-300",
  },
}

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

interface CalendarViewProps {
  onCreateOrEditTask?: (dateOrTask: Date | Task) => void
}

type CalendarDisplayMode = "month" | "week"

export default function CalendarView({ onCreateOrEditTask }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date()) // Default selected to today
  const [activeView, setActiveView] = useState<CalendarDisplayMode>("month")
  const { tasks } = useTasks()

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })
  const currentWeekNumber = getWeek(currentDate, { weekStartsOn: 1, firstWeekContainsDate: 4 })

  const tasksByDate = useMemo(() => {
    const grouped: Record<string, Task[]> = {}
    tasks.forEach((task) => {
      if (task.dueDate) {
        const dateKey = format(task.dueDate, "yyyy-MM-dd")
        if (!grouped[dateKey]) grouped[dateKey] = []
        grouped[dateKey].push(task)
      }
    })
    return grouped
  }, [tasks])

  const getTasksForDate = (date: Date) => tasksByDate[format(date, "yyyy-MM-dd")] || []

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => (direction === "prev" ? subMonths(prev, 1) : addMonths(prev, 1)))
    setSelectedDate(null)
  }

  const navigateWeek = (direction: "prev" | "next") => {
    setCurrentDate((prev) => (direction === "prev" ? subWeeks(prev, 1) : addWeeks(prev, 1)))
    setSelectedDate(null)
  }

  const handleDateClick = (date: Date) => setSelectedDate(date)

  const handleCreateTaskOnDate = (date: Date) => {
    if (onCreateOrEditTask) onCreateOrEditTask(date)
  }

  const handleEditTask = (task: Task) => {
    if (onCreateOrEditTask) onCreateOrEditTask(task)
  }

  const selectedDateTasks = selectedDate ? getTasksForDate(selectedDate) : []

  const navigate = (direction: "prev" | "next") => {
    activeView === "month" ? navigateMonth(direction) : navigateWeek(direction)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-3">
        <Card className="bg-white/80 backdrop-blur-sm border border-gtd-neutral-100 shadow-lg">
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle className="text-2xl font-heading text-gtd-clarity-700">
                {activeView === "month"
                  ? format(currentDate, "MMMM yyyy", { locale: es })
                  : `Semana ${currentWeekNumber} - ${format(weekStart, "d MMM", { locale: es })} al ${format(weekEnd, "d MMM yyyy", { locale: es })}`}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Tabs
                  value={activeView}
                  onValueChange={(value) => setActiveView(value as CalendarDisplayMode)}
                  className="mr-2"
                >
                  <TabsList className="bg-gtd-neutral-100">
                    <TabsTrigger
                      value="month"
                      className="flex items-center gap-1 data-[state=active]:bg-gtd-clarity-500 data-[state=active]:text-white text-gtd-neutral-700"
                    >
                      <Grid3X3 className="h-4 w-4" /> <span className="hidden sm:inline">Mes</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="week"
                      className="flex items-center gap-1 data-[state=active]:bg-gtd-clarity-500 data-[state=active]:text-white text-gtd-neutral-700"
                    >
                      <GridIcon className="h-4 w-4" /> <span className="hidden sm:inline">Semana</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigate("prev")}
                  className="border-gtd-neutral-200 text-gtd-neutral-600 hover:bg-gtd-neutral-100"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDate(new Date())}
                  className="border-gtd-neutral-200 text-gtd-neutral-600 hover:bg-gtd-neutral-100"
                >
                  Hoy
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigate("next")}
                  className="border-gtd-neutral-200 text-gtd-neutral-600 hover:bg-gtd-neutral-100"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {WEEKDAYS.map((day) => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gtd-neutral-500">
                  {day}
                </div>
              ))}
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeView}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-7 gap-1"
              >
                {(activeView === "month" ? calendarDays : weekDays).map((day) => {
                  const dayTasks = getTasksForDate(day)
                  const isCurrentMonthView = activeView === "month" && isSameMonth(day, currentDate)
                  const isSelected = selectedDate && isSameDay(day, selectedDate)
                  const isCurrentDay = isToday(day)

                  return (
                    <div
                      key={day.toISOString()}
                      onClick={() => handleDateClick(day)}
                      className={`
                      min-h-[${activeView === "month" ? "100px" : "200px"}] p-2 border rounded-lg cursor-pointer transition-all hover:bg-gtd-neutral-50
                      ${activeView === "month" ? (isCurrentMonthView ? "bg-white" : "bg-gtd-neutral-50/50 text-gtd-neutral-400") : "bg-white"}
                      ${isSelected ? "ring-2 ring-gtd-clarity-500 bg-gtd-clarity-50/50" : ""}
                      ${isCurrentDay ? `bg-gtd-focus-50/70 border-gtd-focus-200 ${isSelected ? "" : "ring-1 ring-gtd-focus-300"}` : "border-gtd-neutral-200"}
                    `}
                    >
                      <div
                        className={`text-sm font-medium mb-1 ${isCurrentDay && !isSelected ? "text-gtd-focus-600 font-bold" : ""} ${isSelected && isCurrentDay ? "text-gtd-clarity-700" : ""}`}
                      >
                        {format(day, "d")}
                      </div>
                      <div className="space-y-1">
                        {dayTasks.slice(0, activeView === "month" ? 2 : 5).map((task) => (
                          <div
                            key={task.id}
                            className={`text-xs px-1.5 py-0.5 rounded text-white truncate ${PRIORITY_STYLES[task.priority].bg} ${task.completed ? "opacity-60 line-through" : ""}`}
                            title={task.title}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditTask(task)
                            }}
                          >
                            {task.title}
                          </div>
                        ))}
                        {dayTasks.length > (activeView === "month" ? 2 : 5) && (
                          <div className="text-xs text-gtd-neutral-500 px-1.5">
                            +{dayTasks.length - (activeView === "month" ? 2 : 5)} más
                          </div>
                        )}
                        {activeView === "week" && (
                          <Button
                            size="xs" // Assuming you have or can create an 'xs' size
                            variant="ghost"
                            className="w-full text-xs text-gtd-neutral-500 mt-1 py-0.5 h-auto"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCreateTaskOnDate(day)
                            }}
                          >
                            <Plus className="h-3 w-3 mr-1" /> Añadir
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-1 space-y-4">
        <Card className="bg-white/80 backdrop-blur-sm border border-gtd-neutral-100 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-heading text-gtd-clarity-700">
              {selectedDate ? format(selectedDate, "dd MMMM yyyy", { locale: es }) : "Selecciona una fecha"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDate ? (
              <div className="space-y-4">
                <Button
                  onClick={() => handleCreateTaskOnDate(selectedDate)}
                  className="w-full bg-gradient-to-r from-gtd-clarity-500 to-gtd-action-500 hover:from-gtd-clarity-600 hover:to-gtd-action-600 text-white"
                  size="sm"
                >
                  <Plus className="mr-2 h-4 w-4" /> Nueva Tarea para este día
                </Button>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  <h4 className="font-medium text-sm text-gtd-neutral-700">Tareas ({selectedDateTasks.length})</h4>
                  {selectedDateTasks.length === 0 ? (
                    <p className="text-sm text-gtd-neutral-500">No hay tareas para este día.</p>
                  ) : (
                    selectedDateTasks.map((task) => (
                      <div
                        key={task.id}
                        className={`p-2.5 rounded-lg border-l-4 bg-gtd-neutral-50/50 cursor-pointer hover:bg-gtd-neutral-100/70 overflow-hidden ${PRIORITY_STYLES[task.priority].border} ${task.completed ? "opacity-70" : ""}`}
                        onClick={() => handleEditTask(task)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h5
                              className={`font-medium text-sm truncate ${task.completed ? "line-through text-gtd-neutral-500" : "text-gtd-neutral-800"}`}
                              title={task.title}
                            >
                              {task.title}
                            </h5>
                            {task.description && (
                              <p className="text-xs text-gtd-neutral-600 mt-1 truncate" title={task.description}>
                                {task.description}
                              </p>
                            )}
                            <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                              <Badge
                                variant="secondary"
                                className="text-xs bg-gtd-neutral-200 text-gtd-neutral-700 truncate max-w-20"
                                title={task.category}
                              >
                                {task.category}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={`text-xs ${PRIORITY_STYLES[task.priority].badgeBg} ${PRIORITY_STYLES[task.priority].text} ${PRIORITY_STYLES[task.priority].badgeBorder}`}
                              >
                                {task.priority}
                              </Badge>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gtd-neutral-500 hover:text-gtd-clarity-600 flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditTask(task)
                            }}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <CalendarIcon className="h-12 w-12 text-gtd-neutral-300 mx-auto mb-3" />
                <p className="text-sm text-gtd-neutral-500">Haz clic en una fecha para ver sus tareas.</p>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="bg-white/80 backdrop-blur-sm border border-gtd-neutral-100 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-heading text-gtd-clarity-700">Resumen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gtd-neutral-600">Total Tareas Visibles:</span>
              <Badge variant="secondary" className="bg-gtd-neutral-200 text-gtd-neutral-700">
                {Object.values(tasksByDate).flat().length}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gtd-action-700">Alta Prioridad:</span>
              <Badge
                variant="outline"
                className={`${PRIORITY_STYLES.alta.badgeBg} ${PRIORITY_STYLES.alta.text} ${PRIORITY_STYLES.alta.badgeBorder}`}
              >
                {tasks.filter((t) => t.priority === "alta").length}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gtd-confidence-700">Completadas:</span>
              <Badge
                variant="outline"
                className={`${PRIORITY_STYLES.baja.badgeBg} ${PRIORITY_STYLES.baja.text} ${PRIORITY_STYLES.baja.badgeBorder}`}
              >
                {tasks.filter((t) => t.completed).length}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

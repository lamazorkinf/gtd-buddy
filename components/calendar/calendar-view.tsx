"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronLeft, ChevronRight, Plus, CalendarIcon, Grid3X3, Grid } from "lucide-react"
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
import { motion } from "framer-motion"

const PRIORITY_COLORS = {
  baja: "bg-green-500",
  media: "bg-yellow-500",
  alta: "bg-red-500",
}

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

interface CalendarViewProps {
  onCreateTask?: (date: Date) => void
}

type CalendarView = "month" | "week"

export default function CalendarView({ onCreateTask }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [activeView, setActiveView] = useState<CalendarView>("month")
  const { tasks } = useTasks()

  // Configuración para vista mensual
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)

  // Obtener todos los días del mes incluyendo días de semanas anteriores/siguientes para completar la grilla
  const calendarStart = new Date(monthStart)
  calendarStart.setDate(calendarStart.getDate() - ((monthStart.getDay() + 6) % 7)) // Ajustado para que la semana comience en lunes

  const calendarEnd = new Date(monthEnd)
  calendarEnd.setDate(calendarEnd.getDate() + (6 - ((monthEnd.getDay() + 6) % 7))) // Ajustado para que la semana termine en domingo

  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  // Configuración para vista semanal
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }) // 1 = lunes
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 }) // Termina en domingo
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })
  const currentWeekNumber = getWeek(currentDate, { weekStartsOn: 1, firstWeekContainsDate: 4 })

  // Agrupar tareas por fecha
  const tasksByDate = useMemo(() => {
    const grouped: Record<string, Task[]> = {}

    tasks.forEach((task) => {
      if (task.dueDate) {
        const dateKey = format(task.dueDate, "yyyy-MM-dd")
        if (!grouped[dateKey]) {
          grouped[dateKey] = []
        }
        grouped[dateKey].push(task)
      }
    })

    return grouped
  }, [tasks])

  const getTasksForDate = (date: Date) => {
    const dateKey = format(date, "yyyy-MM-dd")
    return tasksByDate[dateKey] || []
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => (direction === "prev" ? subMonths(prev, 1) : addMonths(prev, 1)))
    setSelectedDate(null)
  }

  const navigateWeek = (direction: "prev" | "next") => {
    setCurrentDate((prev) => (direction === "prev" ? subWeeks(prev, 1) : addWeeks(prev, 1)))
    setSelectedDate(null)
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
  }

  const handleCreateTask = () => {
    if (selectedDate && onCreateTask) {
      onCreateTask(selectedDate)
    }
  }

  const selectedDateTasks = selectedDate ? getTasksForDate(selectedDate) : []

  const handleViewChange = (view: CalendarView) => {
    setActiveView(view)
  }

  const navigate = (direction: "prev" | "next") => {
    if (activeView === "month") {
      navigateMonth(direction)
    } else {
      navigateWeek(direction)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Calendario principal */}
      <div className="lg:col-span-3">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-heading">
                {activeView === "month" ? (
                  format(currentDate, "MMMM yyyy", { locale: es })
                ) : (
                  <>
                    Semana {currentWeekNumber} - {format(weekStart, "d MMM", { locale: es })} al{" "}
                    {format(weekEnd, "d MMM yyyy", { locale: es })}
                  </>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Tabs
                  value={activeView}
                  onValueChange={(value) => handleViewChange(value as CalendarView)}
                  className="mr-2"
                >
                  <TabsList>
                    <TabsTrigger value="month" className="flex items-center gap-1">
                      <Grid3X3 className="h-4 w-4" />
                      <span className="hidden sm:inline">Mes</span>
                    </TabsTrigger>
                    <TabsTrigger value="week" className="flex items-center gap-1">
                      <Grid className="h-4 w-4" />
                      <span className="hidden sm:inline">Semana</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                <Button variant="outline" size="sm" onClick={() => navigate("prev")}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                  Hoy
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate("next")}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Días de la semana */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {WEEKDAYS.map((day) => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                  {day}
                </div>
              ))}
            </div>

            {/* Vista mensual */}
            {activeView === "month" && (
              <motion.div
                key="month-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-7 gap-1"
              >
                {calendarDays.map((day) => {
                  const dayTasks = getTasksForDate(day)
                  const isCurrentMonth = isSameMonth(day, currentDate)
                  const isSelected = selectedDate && isSameDay(day, selectedDate)
                  const isCurrentDay = isToday(day)

                  return (
                    <div
                      key={day.toISOString()}
                      onClick={() => handleDateClick(day)}
                      className={`
                        min-h-[100px] p-2 border rounded-lg cursor-pointer transition-all hover:bg-gray-50
                        ${isCurrentMonth ? "bg-white" : "bg-gray-50 text-gray-400"}
                        ${isSelected ? "ring-2 ring-purple-500 bg-purple-50" : ""}
                        ${isCurrentDay ? "bg-blue-50 border-blue-200" : "border-gray-200"}
                      `}
                    >
                      <div className={`text-sm font-medium mb-1 ${isCurrentDay ? "text-blue-600" : ""}`}>
                        {format(day, "d")}
                      </div>

                      {/* Indicadores de tareas */}
                      <div className="space-y-1">
                        {dayTasks.slice(0, 3).map((task) => (
                          <div
                            key={task.id}
                            className={`
                              text-xs px-2 py-1 rounded text-white truncate
                              ${PRIORITY_COLORS[task.priority]}
                              ${task.completed ? "opacity-50 line-through" : ""}
                            `}
                            title={task.title}
                          >
                            {task.title}
                          </div>
                        ))}
                        {dayTasks.length > 3 && (
                          <div className="text-xs text-gray-500 px-2">+{dayTasks.length - 3} más</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </motion.div>
            )}

            {/* Vista semanal */}
            {activeView === "week" && (
              <motion.div
                key="week-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-7 gap-1"
              >
                {weekDays.map((day) => {
                  const dayTasks = getTasksForDate(day)
                  const isSelected = selectedDate && isSameDay(day, selectedDate)
                  const isCurrentDay = isToday(day)

                  return (
                    <div
                      key={day.toISOString()}
                      onClick={() => handleDateClick(day)}
                      className={`
                        min-h-[300px] p-3 border rounded-lg cursor-pointer transition-all hover:bg-gray-50
                        ${isSelected ? "ring-2 ring-purple-500 bg-purple-50" : ""}
                        ${isCurrentDay ? "bg-blue-50 border-blue-200" : "border-gray-200"}
                      `}
                    >
                      <div className="flex flex-col items-center mb-3 pb-2 border-b">
                        <div className="text-xs text-gray-500">{format(day, "EEE", { locale: es })}</div>
                        <div
                          className={`text-xl font-bold ${
                            isCurrentDay
                              ? "text-blue-600 bg-blue-100 rounded-full w-8 h-8 flex items-center justify-center"
                              : ""
                          }`}
                        >
                          {format(day, "d")}
                        </div>
                      </div>

                      {/* Lista de tareas - En vista semanal mostramos más detalles */}
                      <div className="space-y-2">
                        {dayTasks.map((task) => (
                          <div
                            key={task.id}
                            className={`
                              p-2 rounded text-sm border-l-2 bg-white
                              ${
                                task.priority === "alta"
                                  ? "border-red-500"
                                  : task.priority === "media"
                                    ? "border-yellow-500"
                                    : "border-green-500"
                              }
                              ${task.completed ? "opacity-50 line-through" : ""}
                              hover:shadow-sm transition-shadow
                            `}
                          >
                            <div className="font-medium truncate">{task.title}</div>
                            {task.dueDate && (
                              <div className="text-xs text-gray-500 mt-1">
                                {format(task.dueDate, "HH:mm", { locale: es })}
                              </div>
                            )}
                          </div>
                        ))}
                        {dayTasks.length === 0 && (
                          <div className="text-xs text-gray-400 text-center py-2">Sin tareas</div>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="w-full text-xs text-gray-500 mt-2"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedDate(day)
                            onCreateTask && onCreateTask(day)
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" /> Añadir
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </motion.div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Panel lateral con detalles */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-heading">
              {selectedDate ? format(selectedDate, "dd MMMM yyyy", { locale: es }) : "Selecciona una fecha"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDate ? (
              <div className="space-y-4">
                {/* Botón para crear tarea */}
                <Button
                  onClick={handleCreateTask}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  size="sm"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Tarea
                </Button>

                {/* Lista de tareas del día */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-700">Tareas ({selectedDateTasks.length})</h4>

                  {selectedDateTasks.length === 0 ? (
                    <p className="text-sm text-gray-500">No hay tareas para este día</p>
                  ) : (
                    selectedDateTasks.map((task) => (
                      <div
                        key={task.id}
                        className={`
                          p-3 rounded-lg border-l-4 bg-gray-50
                          ${
                            task.priority === "alta"
                              ? "border-red-500"
                              : task.priority === "media"
                                ? "border-yellow-500"
                                : "border-green-500"
                          }
                          ${task.completed ? "opacity-60" : ""}
                        `}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h5 className={`font-medium text-sm ${task.completed ? "line-through" : ""}`}>
                              {task.title}
                            </h5>
                            {task.description && <p className="text-xs text-gray-600 mt-1">{task.description}</p>}
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="secondary" className="text-xs">
                                {task.category}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={`text-xs ${
                                  task.priority === "alta"
                                    ? "text-red-600 border-red-300"
                                    : task.priority === "media"
                                      ? "text-yellow-600 border-yellow-300"
                                      : "text-green-600 border-green-300"
                                }`}
                              >
                                {task.priority}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">Haz clic en una fecha para ver las tareas de ese día</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resumen del mes */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-lg font-heading">
              {activeView === "month" ? "Resumen del Mes" : "Resumen de la Semana"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total de tareas</span>
                <Badge variant="secondary">{Object.values(tasksByDate).flat().length}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Alta prioridad</span>
                <Badge variant="outline" className="text-red-600 border-red-300">
                  {
                    Object.values(tasksByDate)
                      .flat()
                      .filter((t) => t.priority === "alta").length
                  }
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Completadas</span>
                <Badge variant="outline" className="text-green-600 border-green-300">
                  {
                    Object.values(tasksByDate)
                      .flat()
                      .filter((t) => t.completed).length
                  }
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

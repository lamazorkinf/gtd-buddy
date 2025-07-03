"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ChevronLeft, ChevronRight, Clock, Calendar, CalendarDays } from "lucide-react"
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  getWeek,
} from "date-fns"
import { es } from "date-fns/locale"
import { useTasks } from "@/hooks/use-tasks"
import type { Task } from "@/types/task"

interface CalendarViewProps {
  onCreateOrEditTask: (dateOrTask?: Date | Task) => void
}

type ViewMode = "month" | "week"

export default function CalendarView({ onCreateOrEditTask }: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>("week")
  const [showWeekends, setShowWeekends] = useState<boolean>(true)
  const { tasks, updateTask } = useTasks()

  // Filtrar tareas por fecha seleccionada
  const tasksForSelectedDate = tasks.filter((task) => {
    if (!task.dueDate) return false
    const taskDate = task.dueDate instanceof Date ? task.dueDate : task.dueDate.toDate()
    return isSameDay(taskDate, selectedDate)
  })

  // Obtener días del mes actual
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Obtener días de la semana actual
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

  // Filtrar días de la semana si no se muestran fines de semana
  const displayWeekDays = showWeekends ? weekDays : weekDays.slice(0, 5)
  const currentWeekNumber = getWeek(currentDate, { weekStartsOn: 1, firstWeekContainsDate: 4 })

  const getDayTasks = (date: Date) => {
    return tasks.filter((task) => {
      if (!task.dueDate) return false
      const taskDate = task.dueDate instanceof Date ? task.dueDate : task.dueDate.toDate()
      return isSameDay(taskDate, date)
    })
  }

  const handleToggleComplete = async (taskId: string, completed: boolean) => {
    try {
      await updateTask(taskId, { completed: !completed })
    } catch (error) {
      console.error("Error al actualizar tarea:", error)
    }
  }

  const handlePrevPeriod = () => {
    if (viewMode === "month") {
      setCurrentDate(subMonths(currentDate, 1))
    } else {
      setCurrentDate(subWeeks(currentDate, 1))
    }
  }

  const handleNextPeriod = () => {
    if (viewMode === "month") {
      setCurrentDate(addMonths(currentDate, 1))
    } else {
      setCurrentDate(addWeeks(currentDate, 1))
    }
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
    }
  }

  const handleToday = () => {
    const today = new Date()
    setCurrentDate(today)
    setSelectedDate(today)
  }

  const getPeriodTitle = () => {
    if (viewMode === "month") {
      return format(currentDate, "MMMM yyyy", { locale: es })
    } else {
      return {
        dateRange: `${format(weekStart, "d MMM", { locale: es })} al ${format(weekEnd, "d MMM yyyy", { locale: es })}`,
        weekNumber: `Semana ${currentWeekNumber}`,
      }
    }
  }

  const renderMonthView = () => (
    <div className="grid grid-cols-7 gap-2">
      {monthDays.map((date) => {
        const dayTasks = getDayTasks(date)
        const completedTasks = dayTasks.filter((task) => task.completed)
        const pendingTasks = dayTasks.filter((task) => !task.completed)
        const isSelected = isSameDay(date, selectedDate)
        const isTodayDate = isToday(date)

        return (
          <div
            key={date.toISOString()}
            className={`
              min-h-[120px] p-2 border rounded-lg cursor-pointer transition-all hover:bg-gray-50
              ${isSelected ? "bg-blue-50 border-blue-300 ring-2 ring-blue-200" : "border-gray-200"}
              ${isTodayDate ? "bg-yellow-50 border-yellow-300" : ""}
            `}
            onClick={() => handleDateSelect(date)}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className={`
                  text-sm font-medium
                  ${isTodayDate ? "text-yellow-800 font-bold" : "text-gray-700"}
                  ${isSelected ? "text-blue-800" : ""}
                `}
              >
                {format(date, "d")}
              </span>
            </div>

            <div className="space-y-1">
              {pendingTasks.slice(0, 2).map((task) => (
                <div key={task.id} className="text-xs p-1 bg-red-100 text-red-800 rounded truncate" title={task.title}>
                  {task.title}
                </div>
              ))}
              {completedTasks.slice(0, 1).map((task) => (
                <div
                  key={task.id}
                  className="text-xs p-1 bg-green-100 text-green-800 rounded truncate line-through"
                  title={task.title}
                >
                  {task.title}
                </div>
              ))}
              {dayTasks.length > 3 && (
                <div className="text-xs text-gray-500 text-center">+{dayTasks.length - 3} más</div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )

  const renderWeekView = () => (
    <div className={`grid gap-4 ${showWeekends ? "grid-cols-7" : "grid-cols-5"}`}>
      {displayWeekDays.map((date) => {
        const dayTasks = getDayTasks(date)
        const completedTasks = dayTasks.filter((task) => task.completed)
        const pendingTasks = dayTasks.filter((task) => !task.completed)
        const isSelected = isSameDay(date, selectedDate)
        const isTodayDate = isToday(date)

        return (
          <div
            key={date.toISOString()}
            className={`
              min-h-[300px] border rounded-lg cursor-pointer transition-all hover:bg-gray-50
              ${isSelected ? "bg-blue-50 border-blue-300 ring-2 ring-blue-200" : "border-gray-200"}
              ${isTodayDate ? "bg-yellow-50 border-yellow-300" : ""}
            `}
            onClick={() => handleDateSelect(date)}
          >
            <div className="p-3 border-b bg-gray-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">
                    {format(date, "EEEE", { locale: es })}
                  </div>
                  <div
                    className={`
                      text-lg font-bold
                      ${isTodayDate ? "text-yellow-800" : "text-gray-700"}
                      ${isSelected ? "text-blue-800" : ""}
                    `}
                  >
                    {format(date, "d")}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 space-y-2 max-h-[240px] overflow-y-auto">
              {pendingTasks.map((task) => (
                <div
                  key={task.id}
                  className="text-xs p-2 bg-red-100 text-red-800 rounded border-l-2 border-red-400"
                  title={task.title}
                  onClick={(e) => {
                    e.stopPropagation()
                    onCreateOrEditTask(task)
                  }}
                >
                  <div className="font-medium truncate">{task.title}</div>
                  {task.description && <div className="text-red-600 mt-1 truncate">{task.description}</div>}
                </div>
              ))}
              {completedTasks.map((task) => (
                <div
                  key={task.id}
                  className="text-xs p-2 bg-green-100 text-green-800 rounded border-l-2 border-green-400 opacity-75"
                  title={task.title}
                  onClick={(e) => {
                    e.stopPropagation()
                    onCreateOrEditTask(task)
                  }}
                >
                  <div className="font-medium truncate line-through">{task.title}</div>
                  {task.description && (
                    <div className="text-green-600 mt-1 truncate line-through">{task.description}</div>
                  )}
                </div>
              ))}

              {/* Botón para añadir tarea rápida */}
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-gray-500 border-dashed border border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                onClick={(e) => {
                  e.stopPropagation()
                  onCreateOrEditTask(date)
                }}
              >
                Añadir tarea
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )

  return (
    <div className="w-full">
      <Card className="w-full">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <CardTitle className="text-2xl font-bold text-gray-900 font-heading">
                {typeof getPeriodTitle() === "string" ? (
                  getPeriodTitle()
                ) : (
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{getPeriodTitle().dateRange}</div>
                    <div className="text-sm font-normal text-gray-500 mt-1">{getPeriodTitle().weekNumber}</div>
                  </div>
                )}
              </CardTitle>
            </div>

            <div className="flex items-center gap-2">
              {/* Tabs para cambiar vista */}
              <div className="flex items-center gap-3">
                <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
                  <TabsList className="bg-gray-100">
                    <TabsTrigger
                      value="month"
                      className="flex items-center gap-1 data-[state=active]:bg-white text-gray-700"
                    >
                      <Calendar className="h-4 w-4" />
                      <span className="hidden sm:inline">Mes</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="week"
                      className="flex items-center gap-1 data-[state=active]:bg-white text-gray-700"
                    >
                      <CalendarDays className="h-4 w-4" />
                      <span className="hidden sm:inline">Semana</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                {/* Toggle compacto para fines de semana */}
                {viewMode === "week" && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <Switch
                      id="show-weekends"
                      checked={showWeekends}
                      onCheckedChange={setShowWeekends}
                      className="scale-75"
                    />
                    <Label htmlFor="show-weekends" className="text-xs text-gray-600 whitespace-nowrap">
                      Fines de semana
                    </Label>
                  </div>
                )}
              </div>

              <Button variant="outline" size="sm" onClick={handlePrevPeriod}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleToday}>
                Hoy
              </Button>
              <Button variant="outline" size="sm" onClick={handleNextPeriod}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Headers de días para vista mensual */}
          {viewMode === "month" && (
            <div className="grid grid-cols-7 gap-2 mb-4">
              {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => (
                <div key={day} className="p-2 text-center font-semibold text-gray-600 text-sm">
                  {day}
                </div>
              ))}
            </div>
          )}

          {/* Renderizar vista según el modo seleccionado */}
          {viewMode === "month" ? renderMonthView() : renderWeekView()}
        </CardContent>
      </Card>

      {/* Panel de tareas del día seleccionado */}
      {tasksForSelectedDate.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Tareas para {format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tasksForSelectedDate.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => handleToggleComplete(task.id, task.completed)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className={`font-medium ${task.completed ? "line-through text-gray-500" : "text-gray-900"}`}>
                        {task.title}
                      </h4>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {task.category}
                        </Badge>
                        {task.priority && (
                          <Badge variant={task.priority === "alta" ? "destructive" : "secondary"} className="text-xs">
                            {task.priority}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {task.description && <p className="text-sm text-gray-600 mt-1">{task.description}</p>}
                    {task.dueDate && (
                      <p className="text-xs text-gray-500 mt-1">
                        {format(task.dueDate instanceof Date ? task.dueDate : task.dueDate.toDate(), "HH:mm")}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onCreateOrEditTask(task)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Editar
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

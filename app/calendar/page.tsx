"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, User, LogOut, CalendarIcon as CalendarIconLucide, Plus } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import CalendarView from "@/components/calendar/calendar-view"
import TaskForm from "@/components/tasks/task-form"
import ModalTransition from "@/components/transitions/modal-transition"
import type { Task } from "@/types/task"

export default function CalendarPage() {
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined)
  const { user, signOut } = useAuth()

  const handleCreateOrEditTask = (dateOrTask?: Date | Task) => {
    if (dateOrTask instanceof Date || dateOrTask === undefined) {
      setSelectedDate(dateOrTask || new Date())
      setEditingTask(undefined)
    } else {
      setSelectedDate(dateOrTask.dueDate || new Date())
      setEditingTask(dateOrTask)
    }
    setShowTaskForm(true)
  }

  const handleCloseForm = () => {
    setShowTaskForm(false)
    setSelectedDate(null)
    setEditingTask(undefined)
  }

  return (
    <div className="min-h-screen selection:bg-gtd-action-300 selection:text-white">
      <header className="bg-white/90 backdrop-blur-sm shadow-sm border-b border-gtd-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2 text-gtd-neutral-700 hover:text-gtd-clarity-600 hover:bg-gtd-clarity-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Volver al Dashboard</span>
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <CalendarIconLucide className="h-6 w-6 text-gtd-clarity-500" />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gtd-clarity-600 to-gtd-action-500 bg-clip-text text-transparent font-heading">
                  Calendario GTD
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button
                onClick={() => handleCreateOrEditTask(selectedDate || new Date())}
                className="bg-gradient-to-r from-gtd-clarity-500 to-gtd-action-500 hover:from-gtd-clarity-600 hover:to-gtd-action-600 text-white"
                size="sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                Nueva Tarea
              </Button>
              <div className="flex items-center gap-2 text-sm text-gtd-neutral-700">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{user?.displayName || user?.email}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={signOut}
                className="flex items-center gap-2 text-gtd-neutral-700 hover:text-gtd-neutral-900 border-gtd-neutral-200 hover:bg-gtd-neutral-100 bg-transparent"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Salir</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CalendarView onCreateOrEditTask={handleCreateOrEditTask} />

        <ModalTransition isOpen={showTaskForm} onClose={handleCloseForm}>
          <TaskForm
            onClose={handleCloseForm}
            task={editingTask}
            defaultDueDate={editingTask ? undefined : selectedDate || undefined}
          />
        </ModalTransition>
      </main>
    </div>
  )
}

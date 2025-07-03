"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, LogOut, LayoutDashboard, User } from "lucide-react"
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
    <div className="min-h-screen gtd-gradient-bg w-full max-w-7xl mx-auto flex flex-col">
      <header className="bg-white/90 backdrop-blur-sm shadow-sm border-b border-gtd-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gtd-clarity-400 to-gtd-action-400 bg-clip-text text-transparent font-heading">
                GTD Buddy
              </h1>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
                  <LayoutDashboard className="h-4 w-4" /> <span className="hidden sm:inline">Dashboard</span>
                </Button>
              </Link>
              <Link href="/profile">
                <Button variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
                  <User className="h-4 w-4" /> <span className="hidden sm:inline">Perfil</span>
                </Button>
              </Link>
              {/* Botón de Nueva Tarea en el header */}
              <Button
                onClick={() => handleCreateOrEditTask(selectedDate || new Date())}
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
          <CalendarView onCreateOrEditTask={handleCreateOrEditTask} />

          <ModalTransition isOpen={showTaskForm} onClose={handleCloseForm}>
            <TaskForm
              onClose={handleCloseForm}
              task={editingTask}
              defaultDueDate={editingTask ? undefined : selectedDate || undefined}
            />
          </ModalTransition>
        </div>
      </main>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, User, LogOut, Calendar } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import CalendarView from "@/components/calendar/calendar-view"
import TaskForm from "@/components/tasks/task-form"
import ModalTransition from "@/components/transitions/modal-transition"

export default function CalendarPage() {
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const { user, signOut } = useAuth()

  const handleCreateTask = (date: Date) => {
    setSelectedDate(date)
    setShowTaskForm(true)
  }

  const handleCloseForm = () => {
    setShowTaskForm(false)
    setSelectedDate(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-red-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Volver al Dashboard</span>
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <Calendar className="h-6 w-6 text-purple-600" />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-heading">
                  Calendario GTD
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-4">
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
        <CalendarView onCreateTask={handleCreateTask} />

        {/* Task Form Modal con nueva transición */}
        <ModalTransition isOpen={showTaskForm} onClose={handleCloseForm}>
          <TaskForm
            onClose={handleCloseForm}
            task={
              selectedDate
                ? {
                    id: "",
                    title: "",
                    description: "",
                    category: "Inbox",
                    priority: "media",
                    dueDate: selectedDate,
                    completed: false,
                    userId: "",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  }
                : undefined
            }
          />
        </ModalTransition>
      </main>
    </div>
  )
}

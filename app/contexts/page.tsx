"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, User, LogOut, Target, Plus } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import ContextList from "@/components/contexts/context-list"
import ContextForm from "@/components/contexts/context-form"
import TaskForm from "@/components/tasks/task-form"
import { useContexts } from "@/hooks/use-contexts"
import type { Context } from "@/types/task"
import ModalTransition from "@/components/transitions/modal-transition"

export default function ContextsPage() {
  const [showContextForm, setShowContextForm] = useState(false)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [editingContext, setEditingContext] = useState<Context | undefined>()
  const [taskForContext, setTaskForContext] = useState<string | undefined>()
  const { user, signOut } = useAuth()
  const { contexts } = useContexts()

  const handleEditContext = (context: Context) => {
    setEditingContext(context)
    setShowContextForm(true)
  }

  const handleCreateTask = (contextId: string) => {
    setTaskForContext(contextId)
    setShowTaskForm(true)
  }

  const handleCloseContextForm = () => {
    setShowContextForm(false)
    setEditingContext(undefined)
  }

  const handleCloseTaskForm = () => {
    setShowTaskForm(false)
    setTaskForContext(undefined)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-red-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px:8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Volver al Dashboard</span>
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <Target className="h-6 w-6 text-purple-600" />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-heading">
                  Gestión de Contextos
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button
                onClick={() => setShowContextForm(true)}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <Plus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Nuevo Contexto</span>
              </Button>

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
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 font-heading mb-2">Tus Contextos GTD</h2>
          <p className="text-gray-600">
            Organiza y gestiona todos tus contextos. Un contexto puede ser un lugar, persona, herramienta o proyecto que
            agrupa tareas relacionadas.
          </p>
        </div>

        <ContextList onEditContext={handleEditContext} onCreateTask={handleCreateTask} />

        {/* Context Form Modal con nueva transición */}
        <ModalTransition isOpen={showContextForm} onClose={handleCloseContextForm}>
          <ContextForm context={editingContext} onClose={handleCloseContextForm} />
        </ModalTransition>

        {/* Task Form Modal con nueva transición */}
        <ModalTransition isOpen={showTaskForm} onClose={handleCloseTaskForm}>
          <TaskForm
            onClose={handleCloseTaskForm}
            defaultCategory="Próximas acciones"
            defaultContextId={taskForContext}
          />
        </ModalTransition>
      </main>
    </div>
  )
}

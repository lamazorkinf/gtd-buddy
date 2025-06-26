"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, User, LogOut, Target, Plus } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import ContextList from "@/components/contexts/context-list"
import ContextForm from "@/components/contexts/context-form"
import TaskForm from "@/components/tasks/task-form"
import type { Context } from "@/types/task"
import ModalTransition from "@/components/transitions/modal-transition"

export default function ContextsPage() {
  const [showContextForm, setShowContextForm] = useState(false)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [editingContext, setEditingContext] = useState<Context | undefined>()
  const [taskForContext, setTaskForContext] = useState<string | undefined>()
  const { user, signOut } = useAuth()

  const handleEditContext = (context: Context) => {
    setEditingContext(context)
    setShowContextForm(true)
  }

  const handleCreateTaskInContext = (contextId: string) => {
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
                <Target className="h-6 w-6 text-gtd-clarity-500" />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gtd-clarity-600 to-gtd-action-500 bg-clip-text text-transparent font-heading">
                  Gestión de Contextos
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button
                onClick={() => {
                  setEditingContext(undefined)
                  setShowContextForm(true)
                }}
                className="bg-gradient-to-r from-gtd-clarity-500 to-gtd-action-500 hover:from-gtd-clarity-600 hover:to-gtd-action-600 text-white"
                size="sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Nuevo Contexto</span>
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
        <div className="mb-8 p-6 bg-white/70 backdrop-blur-sm rounded-xl shadow-md border border-gtd-neutral-100">
          <p className="text-gtd-neutral-700 leading-relaxed">
            Organiza y gestiona todos tus contextos. Un contexto puede ser un lugar, persona, herramienta o proyecto que
            agrupa tareas relacionadas, ayudándote a enfocarte en lo que puedes hacer según dónde estés o qué tengas a
            mano.
          </p>
        </div>

        <ContextList onEditContext={handleEditContext} onCreateTask={handleCreateTaskInContext} />

        <ModalTransition isOpen={showContextForm} onClose={handleCloseContextForm}>
          <ContextForm context={editingContext} onClose={handleCloseContextForm} />
        </ModalTransition>

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

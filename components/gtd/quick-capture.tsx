"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Zap } from "lucide-react"
import { useTasks } from "@/hooks/use-tasks"
import { motion } from "framer-motion"
import { useAuth } from "@/contexts/auth-context"

export default function QuickCapture() {
  const [title, setTitle] = useState("")
  const [isExpanded, setIsExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const { addTask } = useTasks()
  const { user } = useAuth() // Añadir esta línea

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    try {
      // Verificar que el usuario esté autenticado
      if (!user || !user.uid) {
        console.error("Usuario no autenticado")
        throw new Error("Debes iniciar sesión para añadir tareas")
      }

      await addTask({
        title: title.trim(),
        category: "Inbox",
        priority: "media",
        completed: false,
      })
      setTitle("")
      setIsExpanded(false)
    } catch (error) {
      console.error("Error al capturar tarea:", error)
      // Mostrar un mensaje de error al usuario sería ideal aquí
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <Card className="sticky top-4 z-40 shadow-lg border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
        <CardContent className="p-4">
          <form onSubmit={handleQuickAdd} className="space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-600" />
              <span className="font-medium text-purple-800 font-heading">Captura Rápida</span>
            </div>

            <div className="flex gap-2">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="¿Qué tienes en mente? (va directo al Inbox)"
                onFocus={() => setIsExpanded(true)}
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={loading || !title.trim()}
                size="sm"
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="text-xs text-gray-600 bg-yellow-50 p-2 rounded border-l-4 border-yellow-400"
              >
                💡 <strong>Tip GTD:</strong> Solo escribe el título. Después procesarás esta tarea desde el Inbox para
                aclarar qué acción específica requiere.
              </motion.div>
            )}
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}

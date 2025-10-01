"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, CheckCircle2, Sparkles } from "lucide-react"
import { useTasks } from "@/hooks/use-tasks"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/contexts/auth-context"
import { modernTheme } from "@/lib/theme"

export default function QuickCapture() {
  const [title, setTitle] = useState("")
  const [isExpanded, setIsExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const { addTask } = useTasks()
  const { user } = useAuth()

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    try {
      if (!user || !user.uid) {
        console.error("Usuario no autenticado")
        throw new Error("Debes iniciar sesión para añadir tareas")
      }

      await addTask({
        title: title.trim(),
        category: "Inbox",
        completed: false,
      })

      setTitle("")
      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
        setIsExpanded(false)
      }, 2000)
    } catch (error) {
      console.error("Error al capturar tarea:", error)
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
      <Card className={`sticky top-4 z-40 ${modernTheme.effects.glass} ${modernTheme.container.shadow} border ${modernTheme.colors.cardBorder} ${modernTheme.container.radius} ${modernTheme.effects.glassHover} ${modernTheme.effects.transition}`}>
        <CardContent className="p-4">
          <form onSubmit={handleQuickAdd} className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className={`h-5 w-5 ${modernTheme.colors.primaryText}`} />
              <span className={`font-medium ${modernTheme.colors.primaryText} ${modernTheme.typography.heading}`}>Captura Rápida</span>
            </div>

            <div className="flex gap-2 relative">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="¿Qué tienes en mente? (va directo al Inbox)"
                onFocus={() => setIsExpanded(true)}
                className={`flex-1 ${modernTheme.container.radius} ${modernTheme.effects.transition} focus:ring-2 focus:ring-purple-300`}
              />
              <Button
                type="submit"
                disabled={loading || !title.trim()}
                size="sm"
                className={`${modernTheme.colors.primary} ${modernTheme.colors.primaryHover} ${modernTheme.container.radius} ${modernTheme.container.shadowSm} ${modernTheme.effects.transition}`}
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Plus className="h-4 w-4" />
                  </motion.div>
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>

              <AnimatePresence>
                {showSuccess && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className={`absolute right-0 top-1/2 -translate-y-1/2 ${modernTheme.colors.success} text-white px-3 py-1 rounded-full flex items-center gap-2 shadow-lg`}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm font-medium">¡Capturado!</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <AnimatePresence>
              {isExpanded && !showSuccess && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className={`text-xs ${modernTheme.colors.mutedForeground} ${modernTheme.effects.glass} p-3 ${modernTheme.container.radius} border-l-4 border-purple-400 ${modernTheme.effects.glassHover} ${modernTheme.effects.transition}`}>
                    <Sparkles className="h-3 w-3 inline mr-1" /> <strong>Tip GTD:</strong> Solo escribe el título. Después procesarás esta tarea desde el Inbox
                    para aclarar qué acción específica requiere.
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}

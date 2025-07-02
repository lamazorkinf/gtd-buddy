"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { CalendarIcon, Save, X } from "lucide-react"
import type { Subtask } from "@/types/task"

/**
 * Converts many possible date representations (Date | string | number | { seconds: number }) to a native Date.
 * Returns undefined if the value cannot be parsed.
 */
function toDate(value: unknown): Date | undefined {
  if (!value) return undefined

  if (value instanceof Date) return isNaN(value.getTime()) ? undefined : value

  // Firestore Timestamp → { seconds: number }
  if (typeof value === "object" && value !== null && "seconds" in value) {
    const secs = (value as { seconds: number }).seconds
    return new Date(secs * 1000)
  }

  // ISO string or epoch number
  const parsed = new Date(value as string | number)
  return isNaN(parsed.getTime()) ? undefined : parsed
}

interface SubtaskEditModalProps {
  subtask: Subtask
  isOpen: boolean
  onClose: () => void
  onSave: (updatedSubtask: Subtask) => void
}

export default function SubtaskEditModal({ subtask, isOpen, onClose, onSave }: SubtaskEditModalProps) {
  const [title, setTitle] = useState(subtask.title)
  const [dueDate, setDueDate] = useState<Date | undefined>(toDate(subtask.dueDate))

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value
    if (dateValue) {
      const [year, month, day] = dateValue.split("-").map(Number)
      const localDate = new Date(year, month - 1, day)
      setDueDate(localDate)
    } else {
      setDueDate(undefined)
    }
  }

  const formatDateForInput = (raw: Date | unknown): string => {
    const date = toDate(raw)
    if (!date) return ""
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  const handleSave = () => {
    if (!title.trim()) return

    const updatedSubtask: Subtask = {
      ...subtask,
      title: title.trim(),
      dueDate,
    }

    onSave(updatedSubtask)
    onClose()
  }

  const handleClose = () => {
    setTitle(subtask.title)
    setDueDate(toDate(subtask.dueDate))
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">Editar Subtarea</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Título *</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Descripción de la subtarea"
              className="w-full"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Fecha límite (opcional)</label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="date"
                    value={formatDateForInput(dueDate)}
                    onChange={handleDateChange}
                    className="pl-10"
                    placeholder="Seleccionar fecha"
                  />
                </div>
                {dueDate && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setDueDate(undefined)}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Quitar
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleClose} className="flex items-center gap-2 bg-transparent">
            <X className="h-4 w-4" />
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!title.trim()}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
          >
            <Save className="h-4 w-4" />
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useState, useEffect } from "react"
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Task, GTDCategory, Priority } from "@/types/task"
import { useAuth } from "@/contexts/auth-context"

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      setTasks([])
      setLoading(false)
      return
    }

    const q = query(collection(db, "tasks"), where("userId", "==", user.uid), orderBy("createdAt", "desc"))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        dueDate: doc.data().dueDate?.toDate() || undefined,
        lastReviewed: doc.data().lastReviewed?.toDate() || undefined,
      })) as Task[]

      // Migrar projectId a contextId si existe
      const migratedTasks = tasksData.map((task) => {
        const newTask = { ...task }
        if (newTask.projectId && !newTask.contextId) {
          newTask.contextId = newTask.projectId
          delete newTask.projectId
        }
        return newTask
      })

      setTasks(migratedTasks)
      setLoading(false)
    })

    return unsubscribe
  }, [user])

  // Función helper para limpiar datos antes de enviar a Firestore
  const cleanTaskData = (taskData: any) => {
    const cleanData: any = {}

    // Campos obligatorios
    if (taskData.title !== undefined) cleanData.title = taskData.title
    if (taskData.category !== undefined) cleanData.category = taskData.category
    if (taskData.priority !== undefined) cleanData.priority = taskData.priority
    if (taskData.completed !== undefined) cleanData.completed = taskData.completed
    if (taskData.userId !== undefined) cleanData.userId = taskData.userId

    // Campos opcionales - solo incluir si tienen valor
    if (taskData.description) cleanData.description = taskData.description
    if (taskData.dueDate) cleanData.dueDate = taskData.dueDate
    if (taskData.contextId) cleanData.contextId = taskData.contextId
    if (taskData.energyLevel) cleanData.energyLevel = taskData.energyLevel
    if (taskData.estimatedMinutes) cleanData.estimatedMinutes = taskData.estimatedMinutes
    if (taskData.isQuickAction !== undefined) cleanData.isQuickAction = taskData.isQuickAction
    if (taskData.lastReviewed) cleanData.lastReviewed = taskData.lastReviewed

    // Subtareas - siempre incluir, incluso si está vacío
    if (taskData.subtasks !== undefined) cleanData.subtasks = taskData.subtasks

    // Timestamps
    if (taskData.createdAt) cleanData.createdAt = taskData.createdAt
    if (taskData.updatedAt) cleanData.updatedAt = taskData.updatedAt

    return cleanData
  }

  const addTask = async (taskData: Omit<Task, "id" | "userId" | "createdAt" | "updatedAt">) => {
    if (!user) return

    const dataToSave = cleanTaskData({
      ...taskData,
      userId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      energyLevel: taskData.energyLevel || "media",
      isQuickAction: taskData.isQuickAction || false,
    })

    await addDoc(collection(db, "tasks"), dataToSave)
  }

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    const dataToUpdate = cleanTaskData({
      ...updates,
      updatedAt: serverTimestamp(),
    })

    await updateDoc(doc(db, "tasks", taskId), dataToUpdate)
  }

  const deleteTask = async (taskId: string) => {
    await deleteDoc(doc(db, "tasks", taskId))
  }

  const getTasksByCategory = (category: GTDCategory) => {
    return tasks.filter((task) => task.category === category)
  }

  const getTasksByPriority = (priority: Priority) => {
    return tasks.filter((task) => task.priority === priority)
  }

  const getTasksByContextId = (contextId: string) => {
    return tasks.filter((task) => task.contextId === contextId)
  }

  return {
    tasks,
    loading,
    addTask,
    updateTask,
    deleteTask,
    getTasksByCategory,
    getTasksByPriority,
    getTasksByContextId,
  }
}

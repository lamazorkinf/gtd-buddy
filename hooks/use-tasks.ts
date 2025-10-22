"use client"

import { useState, useEffect, useMemo } from "react"
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
import type { Task, GTDCategory } from "@/types/task"
import { useAuth } from "@/contexts/auth-context"

interface UseTasksOptions {
  teamId?: string | null // undefined = all, null = personal only, string = specific team
}

export function useTasks(options: UseTasksOptions = {}) {
  const { teamId } = options

  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  // Construir query condicional según teamId
  const q = useMemo(() => {
    if (!user) return null

    const baseCollection = collection(db, "tasks")

    if (teamId === undefined) {
      // Modo "Todo": todas las tareas del usuario (personal + equipos)
      return query(baseCollection, where("userId", "==", user.uid), orderBy("createdAt", "desc"))
    } else if (teamId === null) {
      // Modo "Personal": traer todas las tareas del usuario y filtrar en cliente
      // (Firestore no puede filtrar por campo inexistente o null eficientemente)
      return query(baseCollection, where("userId", "==", user.uid), orderBy("createdAt", "desc"))
    } else {
      // Modo "Equipo": solo tareas del teamId específico
      return query(baseCollection, where("teamId", "==", teamId), orderBy("createdAt", "desc"))
    }
  }, [user, teamId])

  useEffect(() => {
    if (!user || !q) {
      setTasks([])
      setLoading(false)
      return
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let tasksData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        dueDate: doc.data().dueDate?.toDate() || undefined,
        lastReviewed: doc.data().lastReviewed?.toDate() || undefined,
      })) as Task[]

      // Si estamos en modo Personal (teamId === null), filtrar en cliente
      if (teamId === null) {
        tasksData = tasksData.filter((task) => !task.teamId || task.teamId === null)
      }

      // Migrar projectId a contextId si existe
      const migratedTasks = tasksData.map((task) => {
        const newTask = { ...task } as any
        if (newTask.projectId && !newTask.contextId) {
          newTask.contextId = newTask.projectId
          delete newTask.projectId
        }
        return newTask as Task
      })

      setTasks(migratedTasks)
      setLoading(false)
    })

    return () => {
      unsubscribe()
    }
  }, [user, q, teamId])

  // Función helper para limpiar datos antes de enviar a Firestore
  const cleanTaskData = (taskData: any) => {
    const cleanData: any = {}

    // Campos obligatorios
    if (taskData.title !== undefined) cleanData.title = taskData.title
    if (taskData.category !== undefined) cleanData.category = taskData.category
    if (taskData.completed !== undefined) cleanData.completed = taskData.completed
    if (taskData.userId !== undefined) cleanData.userId = taskData.userId

    // Campos opcionales - solo incluir si tienen valor
    if (taskData.description) cleanData.description = taskData.description
    if (taskData.dueDate) cleanData.dueDate = taskData.dueDate
    if (taskData.contextId) cleanData.contextId = taskData.contextId
    if (taskData.estimatedMinutes) cleanData.estimatedMinutes = taskData.estimatedMinutes
    if (taskData.isQuickAction !== undefined) cleanData.isQuickAction = taskData.isQuickAction
    if (taskData.lastReviewed) cleanData.lastReviewed = taskData.lastReviewed

    // Campos de equipo - explícitamente incluir null si no están presentes
    cleanData.teamId = taskData.teamId !== undefined ? taskData.teamId : null
    cleanData.assignedTo = taskData.assignedTo !== undefined ? taskData.assignedTo : null

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

  const getTasksByContextId = (contextId: string) => {
    return tasks.filter((task) => task.contextId === contextId)
  }

  // Obtener tareas asignadas a un usuario específico (para equipos)
  const getTasksByAssignee = (userId: string) => {
    return tasks.filter((task) => task.assignedTo === userId)
  }

  // Obtener tareas sin asignar de un equipo
  const getUnassignedTasks = () => {
    return tasks.filter((task) => task.teamId && !task.assignedTo)
  }

  // Obtener tareas de un equipo específico
  const getTasksByTeam = (teamIdToFilter: string) => {
    return tasks.filter((task) => task.teamId === teamIdToFilter)
  }

  return {
    tasks,
    loading,
    addTask,
    updateTask,
    deleteTask,
    getTasksByCategory,
    getTasksByContextId,
    getTasksByAssignee,
    getUnassignedTasks,
    getTasksByTeam,
  }
}

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
import type { Context } from "@/types/task"
import { useAuth } from "@/contexts/auth-context"

interface UseContextsOptions {
  teamId?: string | null // undefined = all, null = personal only, string = specific team
}

export function useContexts(options: UseContextsOptions = {}) {
  const { teamId } = options

  const [contexts, setContexts] = useState<Context[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  // Construir query condicional según teamId
  const q = useMemo(() => {
    if (!user) return null

    const baseCollection = collection(db, "contexts")

    if (teamId === undefined) {
      // Modo "Todo": todos los contextos del usuario (personal + equipos)
      return query(baseCollection, where("userId", "==", user.uid), orderBy("createdAt", "desc"))
    } else if (teamId === null) {
      // Modo "Personal": traer todos los contextos del usuario y filtrar en cliente
      // (Firestore no puede filtrar por campo inexistente o null eficientemente)
      return query(baseCollection, where("userId", "==", user.uid), orderBy("createdAt", "desc"))
    } else {
      // Modo "Equipo": solo contextos del teamId específico
      return query(baseCollection, where("teamId", "==", teamId), orderBy("createdAt", "desc"))
    }
  }, [user, teamId])

  useEffect(() => {
    if (!user || !q) {
      setContexts([])
      setLoading(false)
      return
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let contextsData = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          name: data.name || '',
          userId: data.userId || user.uid,
          description: data.description,
          status: data.status || 'active',
          teamId: data.teamId,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          lastReviewed: data.lastReviewed?.toDate() || undefined,
        } as Context
      })

      // Si estamos en modo Personal (teamId === null), filtrar en cliente
      if (teamId === null) {
        contextsData = contextsData.filter((context) => !context.teamId || context.teamId === null)
      }

      setContexts(contextsData)
      setLoading(false)
    })

    return () => {
      unsubscribe()
    }
  }, [user, q, teamId])

  const addContext = async (contextData: Omit<Context, "id" | "userId" | "createdAt">) => {
    if (!user) return

    const cleanData: any = {
      name: contextData.name,
      userId: user.uid,
      createdAt: serverTimestamp(),
    }

    // Añadir campos opcionales si existen
    if (contextData.description) cleanData.description = contextData.description
    if (contextData.status) cleanData.status = contextData.status
    if (contextData.updatedAt) cleanData.updatedAt = contextData.updatedAt
    if (contextData.lastReviewed) cleanData.lastReviewed = contextData.lastReviewed

    // Campos de equipo - explícitamente incluir null si no están presentes
    cleanData.teamId = contextData.teamId !== undefined ? contextData.teamId : null

    // Añadir updatedAt
    cleanData.updatedAt = serverTimestamp()

    await addDoc(collection(db, "contexts"), cleanData)
  }

  const updateContext = async (contextId: string, updates: Partial<Context>) => {
    // Elimina todas las propiedades cuyo valor sea undefined
    const cleanUpdates: Record<string, unknown> = {}
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        cleanUpdates[key] = value
      }
    })

    const updatesWithTimestamp = {
      ...cleanUpdates,
      updatedAt: serverTimestamp(),
    }

    await updateDoc(doc(db, "contexts", contextId), updatesWithTimestamp)
  }

  const deleteContext = async (contextId: string) => {
    await deleteDoc(doc(db, "contexts", contextId))
  }

  const getActiveContexts = () => {
    return contexts.filter((context) => context.status === "active" || !context.status)
  }

  const getContextById = (contextId: string) => {
    return contexts.find((context) => context.id === contextId)
  }

  return {
    contexts,
    loading,
    addContext,
    updateContext,
    deleteContext,
    getActiveContexts,
    getContextById,
  }
}

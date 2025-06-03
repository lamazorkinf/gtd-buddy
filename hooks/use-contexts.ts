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
import type { Context } from "@/types/task"
import { useAuth } from "@/contexts/auth-context"

export function useContexts() {
  const [contexts, setContexts] = useState<Context[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      setContexts([])
      setLoading(false)
      return
    }

    const q = query(collection(db, "contexts"), where("userId", "==", user.uid), orderBy("createdAt", "desc"))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const contextsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        lastReviewed: doc.data().lastReviewed?.toDate() || undefined,
        targetDate: doc.data().targetDate?.toDate() || undefined,
      })) as Context[]

      setContexts(contextsData)
      setLoading(false)
    })

    return unsubscribe
  }, [user])

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
    if (contextData.targetDate) cleanData.targetDate = contextData.targetDate
    if (contextData.lastReviewed) cleanData.lastReviewed = contextData.lastReviewed

    // Añadir updatedAt
    cleanData.updatedAt = serverTimestamp()

    await addDoc(collection(db, "contexts"), cleanData)
  }

  const updateContext = async (contextId: string, updates: Partial<Context>) => {
    const updatesWithTimestamp = {
      ...updates,
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

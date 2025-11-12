import { getFirebaseAdmin } from "@/lib/firebase-admin"
import type { ConversationContext, UserIntent } from "@/types/whatsapp"

/**
 * Obtener o crear contexto de conversación para un usuario
 */
export async function getConversationContext(
  userId: string,
  whatsappNumber: string
): Promise<ConversationContext | null> {
  const { db } = getFirebaseAdmin()

  try {
    // Buscar contexto existente
    const snapshot = await db
      .collection("conversationContexts")
      .where("userId", "==", userId)
      .where("whatsappNumber", "==", whatsappNumber)
      .limit(1)
      .get()

    if (!snapshot.empty) {
      const doc = snapshot.docs[0]
      const data = doc.data()

      // Verificar si el contexto ha expirado
      const expiresAt = data.expiresAt?.toDate()
      if (expiresAt && expiresAt < new Date()) {
        // Contexto expirado, eliminarlo y retornar null
        await doc.ref.delete()
        return null
      }

      // Convertir Firestore timestamps a Date
      const conversationHistory = (data.conversationHistory || []).map((msg: any) => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp?.toDate() || new Date(),
      }))

      return {
        id: doc.id,
        userId: data.userId,
        whatsappNumber: data.whatsappNumber,
        lastTaskId: data.lastTaskId,
        lastIntent: data.lastIntent,
        conversationHistory,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        expiresAt: expiresAt || new Date(),
      }
    }

    return null
  } catch (error) {
    console.error("Error obteniendo contexto de conversación:", error)
    return null
  }
}

/**
 * Crear nuevo contexto de conversación
 */
export async function createConversationContext(
  userId: string,
  whatsappNumber: string
): Promise<ConversationContext> {
  const { db } = getFirebaseAdmin()

  const now = new Date()
  const expiresAt = new Date(now.getTime() + 60 * 60 * 1000) // Expira en 1 hora

  const contextData = {
    userId,
    whatsappNumber,
    conversationHistory: [],
    createdAt: now,
    updatedAt: now,
    expiresAt,
  }

  const docRef = await db.collection("conversationContexts").add(contextData)

  return {
    id: docRef.id,
    ...contextData,
  }
}

/**
 * Actualizar contexto de conversación
 */
export async function updateConversationContext(
  contextId: string,
  updates: {
    lastTaskId?: string
    lastIntent?: UserIntent
    conversationHistory?: ConversationContext["conversationHistory"]
  }
): Promise<void> {
  const { db } = getFirebaseAdmin()

  try {
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000) // Extender expiración 1 hora más

    await db
      .collection("conversationContexts")
      .doc(contextId)
      .update({
        ...updates,
        updatedAt: now,
        expiresAt,
      })
  } catch (error) {
    console.error("Error actualizando contexto de conversación:", error)
    throw error
  }
}

/**
 * Agregar mensaje al historial de conversación (mantiene solo últimos 5)
 */
export async function addToConversationHistory(
  contextId: string,
  role: "user" | "assistant",
  content: string
): Promise<void> {
  const { db } = getFirebaseAdmin()

  try {
    const docRef = db.collection("conversationContexts").doc(contextId)
    const doc = await docRef.get()

    if (!doc.exists) {
      console.error("Contexto no encontrado:", contextId)
      return
    }

    const data = doc.data()
    const history = data?.conversationHistory || []

    // Agregar nuevo mensaje
    const newMessage = {
      role,
      content,
      timestamp: new Date(),
    }

    // Mantener solo los últimos 5 mensajes
    const updatedHistory = [...history, newMessage].slice(-5)

    // Extender expiración
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

    await docRef.update({
      conversationHistory: updatedHistory,
      updatedAt: new Date(),
      expiresAt,
    })
  } catch (error) {
    console.error("Error agregando mensaje al historial:", error)
  }
}

/**
 * Limpiar contextos de conversación expirados
 * Debería ejecutarse periódicamente (ej: cada hora via cron job)
 */
export async function cleanExpiredContexts(): Promise<number> {
  const { db } = getFirebaseAdmin()

  try {
    const now = new Date()
    const snapshot = await db
      .collection("conversationContexts")
      .where("expiresAt", "<", now)
      .get()

    if (snapshot.empty) {
      return 0
    }

    // Eliminar en batch
    const batch = db.batch()
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref)
    })

    await batch.commit()

    console.log(`🧹 Limpiados ${snapshot.size} contextos expirados`)
    return snapshot.size
  } catch (error) {
    console.error("Error limpiando contextos expirados:", error)
    return 0
  }
}

/**
 * Obtener o crear contexto de conversación
 */
export async function getOrCreateConversationContext(
  userId: string,
  whatsappNumber: string
): Promise<ConversationContext> {
  let context = await getConversationContext(userId, whatsappNumber)

  if (!context) {
    context = await createConversationContext(userId, whatsappNumber)
  }

  return context
}

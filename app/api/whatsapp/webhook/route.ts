export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { getFirebaseAdmin } from "@/lib/firebase-admin"
import type { EvolutionAPIWebhook, ProcessedTaskData } from "@/types/whatsapp"
import type { Context } from "@/types/task"
import { processWhatsAppMessage } from "@/lib/openai-utils"

// Extraer número de teléfono del remoteJid de WhatsApp
function extractPhoneNumber(remoteJid: string): string {
  return remoteJid.split("@")[0]
}

// Normalizar número de WhatsApp al formato internacional
function normalizeWhatsAppNumber(phoneNumber: string): string {
  let normalized = phoneNumber.replace(/[^\d+]/g, "")
  if (normalized.startsWith("+")) {
    normalized = normalized.slice(1)
  }
  return normalized
}

// Buscar userId por número de WhatsApp
async function getUserIdByWhatsAppNumber(whatsappNumber: string): Promise<string | null> {
  const { db } = getFirebaseAdmin()
  const normalized = normalizeWhatsAppNumber(whatsappNumber)

  const snapshot = await db
    .collection("whatsappLinks")
    .where("whatsappNumber", "==", normalized)
    .where("isActive", "==", true)
    .limit(1)
    .get()

  if (snapshot.empty) {
    return null
  }

  return snapshot.docs[0].data().userId || null
}

// Activar link de WhatsApp
async function activateWhatsAppLink(linkCode: string, whatsappNumber: string): Promise<boolean> {
  const { db } = getFirebaseAdmin()
  const normalized = normalizeWhatsAppNumber(whatsappNumber)

  const snapshot = await db
    .collection("whatsappLinks")
    .where("linkCode", "==", linkCode)
    .where("isActive", "==", false)
    .limit(1)
    .get()

  if (snapshot.empty) {
    return false
  }

  const linkDoc = snapshot.docs[0]
  const linkData = linkDoc.data()

  // Verificar que el código no haya expirado
  const expiryDate = linkData.linkCodeExpiry?.toDate()
  if (expiryDate && expiryDate < new Date()) {
    return false
  }

  // Verificar que el número coincida
  if (linkData.whatsappNumber !== normalized) {
    return false
  }

  // Activar el link
  await linkDoc.ref.update({
    isActive: true,
    linkCode: null,
    linkCodeExpiry: null,
    updatedAt: new Date(),
  })

  return true
}

/**
 * Webhook para recibir mensajes de Evolution API
 */
export async function POST(request: NextRequest) {
  try {
    const webhook: EvolutionAPIWebhook = await request.json()

    // Verificar API key de Evolution API (seguridad básica)
    // Evolution API puede enviar la API key en el header o en el payload
    const authHeader = request.headers.get("apikey") || request.headers.get("x-api-key")
    const apikeyInPayload = webhook.apikey

    const expectedApiKey = process.env.EVOLUTION_API_KEY

    console.log("🔑 Verificando API key:", {
      hasHeader: !!authHeader,
      hasPayload: !!apikeyInPayload,
      headerMatch: authHeader === expectedApiKey,
      payloadMatch: apikeyInPayload === expectedApiKey,
      expectedLength: expectedApiKey?.length,
      receivedPayloadLength: apikeyInPayload?.length
    })

    if (authHeader !== expectedApiKey && apikeyInPayload !== expectedApiKey) {
      console.error("❌ API key inválida")
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    console.log("✅ API key verificada correctamente")

    console.log("📱 Mensaje de WhatsApp recibido:", {
      event: webhook.event,
      sender: webhook.sender,
      messageType: webhook.data.messageType,
    })

    // Solo procesar mensajes recibidos (no enviados por nosotros)
    if (webhook.data.key.fromMe) {
      console.log("⏭️ Mensaje enviado por nosotros, ignorando")
      return NextResponse.json({ success: true, message: "Mensaje propio ignorado" })
    }

    // Solo procesar mensajes de texto y audio
    const messageType = webhook.data.messageType
    if (messageType !== "conversation" && messageType !== "extendedTextMessage" && messageType !== "audioMessage") {
      console.log("⏭️ Tipo de mensaje no soportado:", messageType)
      return NextResponse.json({ success: true, message: "Tipo de mensaje no soportado" })
    }

    // Extraer datos del mensaje
    const phoneNumber = extractPhoneNumber(webhook.data.key.remoteJid)
    const senderName = webhook.data.pushName || "Usuario"

    let textMessage: string | undefined
    let audioUrl: string | undefined

    if (messageType === "conversation") {
      textMessage = webhook.data.message?.conversation
    } else if (messageType === "extendedTextMessage") {
      textMessage = webhook.data.message?.extendedTextMessage?.text
    } else if (messageType === "audioMessage") {
      audioUrl = webhook.data.message?.audioMessage?.url
      console.log("🎤 Mensaje de audio detectado:", {
        url: audioUrl,
        fullAudioMessage: JSON.stringify(webhook.data.message?.audioMessage)
      })
    }

    if (!textMessage && !audioUrl) {
      console.log("⚠️ No se pudo extraer contenido del mensaje", {
        messageType,
        message: JSON.stringify(webhook.data.message)
      })
      return NextResponse.json({ error: "Sin contenido" }, { status: 400 })
    }

    console.log("📝 Contenido extraído:", { textMessage, audioUrl })

    // Verificar si es un código de vinculación
    if (textMessage && /^\d{6}$/.test(textMessage.trim())) {
      const linkCode = textMessage.trim()
      console.log("🔗 Intentando vincular cuenta con código:", linkCode)

      const success = await activateWhatsAppLink(linkCode, phoneNumber)

      if (success) {
        console.log("✅ Cuenta vinculada exitosamente")
        await sendWhatsAppMessage(
          phoneNumber,
          `✅ ¡Cuenta vinculada exitosamente!\n\nAhora puedes enviarme mensajes de texto o notas de voz para crear tareas.\n\nEjemplo:\n"Llamar al dentista mañana a las 3pm"\n"Comprar leche y pan @compras"`
        )
        return NextResponse.json({ success: true, message: "Cuenta vinculada" })
      } else {
        console.log("❌ Código de vinculación inválido o expirado")
        await sendWhatsAppMessage(
          phoneNumber,
          `❌ Código inválido o expirado.\n\nGenera un nuevo código desde el dashboard de GTD Buddy.`
        )
        return NextResponse.json({ error: "Código inválido" }, { status: 400 })
      }
    }

    // Buscar userId asociado al número de WhatsApp
    const userId = await getUserIdByWhatsAppNumber(phoneNumber)

    if (!userId) {
      console.log("⚠️ Usuario no vinculado")
      await sendWhatsAppMessage(
        phoneNumber,
        `¡Hola! 👋\n\nPara usar GTD Buddy por WhatsApp, primero debes vincular tu cuenta.\n\n1. Ingresa a tu dashboard en ${process.env.NEXT_PUBLIC_APP_URL}\n2. Ve a Configuración > WhatsApp\n3. Genera tu código de vinculación\n4. Envíame ese código de 6 dígitos\n\n¡Nos vemos pronto!`
      )
      return NextResponse.json({ error: "Usuario no vinculado" }, { status: 403 })
    }

    console.log("👤 Usuario encontrado:", userId)

    // Verificar suscripción del usuario
    const { db } = getFirebaseAdmin()
    const userDoc = await db.collection("users").doc(userId).get()

    if (!userDoc.exists) {
      console.error("❌ Usuario no encontrado en Firestore")
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    const userData = userDoc.data() || {}
    const subscriptionStatus = userData.subscriptionStatus

    // Permitir solo usuarios con suscripción activa, trial o test
    if (
      subscriptionStatus !== "active" &&
      subscriptionStatus !== "trial" &&
      subscriptionStatus !== "test" &&
      userData.role !== "test"
    ) {
      console.log("⚠️ Usuario sin suscripción activa")
      await sendWhatsAppMessage(
        phoneNumber,
        `⚠️ Tu suscripción ha expirado.\n\nPara seguir usando GTD Buddy, renueva tu suscripción en:\n${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
      )
      return NextResponse.json({ error: "Suscripción inactiva" }, { status: 403 })
    }

    // Procesar el mensaje con IA
    console.log("🤖 Procesando mensaje con IA...")
    const processedData: ProcessedTaskData = await processWhatsAppMessage(
      textMessage,
      audioUrl,
      webhook.data.key.id,
      webhook.data.key.remoteJid
    )

    console.log("📊 Datos procesados:", processedData)

    // Buscar contextId si se sugirió un contexto
    let contextId: string | undefined
    if (processedData.contextName) {
      const contextDoc = await findContextByName(userId, processedData.contextName)
      if (contextDoc) {
        contextId = contextDoc.id
        console.log("✅ Contexto encontrado:", contextDoc.name)
      } else {
        console.log("⚠️ Contexto no encontrado, se creará la tarea sin contexto")
      }
    }

    // Crear la tarea en Firestore usando Admin SDK
    const taskData: any = {
      title: processedData.title,
      description: processedData.description || `Creado desde WhatsApp por ${senderName}`,
      category: processedData.category,
      completed: false,
      userId: userId,
      isQuickAction: processedData.isQuickAction || false,
      createdAt: new Date(),
      updatedAt: new Date(),
      teamId: null, // Tareas desde WhatsApp siempre son personales
      assignedTo: null,
    }

    // Agregar campos opcionales solo si tienen valor
    if (contextId) taskData.contextId = contextId
    if (processedData.estimatedMinutes) taskData.estimatedMinutes = processedData.estimatedMinutes
    if (processedData.dueDate) taskData.dueDate = processedData.dueDate

    const taskRef = await db.collection("tasks").add(taskData)
    console.log("✅ Tarea creada:", taskRef.id)

    // Enviar confirmación al usuario
    let confirmationMessage = `✅ Tarea creada:\n\n📝 ${processedData.title}`

    if (processedData.category !== "Inbox") {
      confirmationMessage += `\n📂 ${processedData.category}`
    }

    if (contextId && processedData.contextName) {
      confirmationMessage += `\n🏷️ ${processedData.contextName}`
    }

    if (processedData.dueDate) {
      const dateStr = processedData.dueDate.toLocaleDateString("es-AR", {
        weekday: "short",
        day: "numeric",
        month: "short",
      })
      confirmationMessage += `\n📅 ${dateStr}`
    }

    if (processedData.estimatedMinutes) {
      confirmationMessage += `\n⏱️ ${processedData.estimatedMinutes} min`
    }

    if (processedData.isQuickAction) {
      confirmationMessage += `\n⚡ Acción rápida (< 2 min)`
    }

    await sendWhatsAppMessage(phoneNumber, confirmationMessage)

    return NextResponse.json({
      success: true,
      taskId: taskRef.id,
      processedData,
    })
  } catch (error) {
    console.error("❌ Error procesando webhook:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

/**
 * Busca un contexto por nombre (case-insensitive)
 */
async function findContextByName(userId: string, contextName: string): Promise<Context | null> {
  const { db } = getFirebaseAdmin()
  const snapshot = await db.collection("contexts").where("userId", "==", userId).get()

  const normalizedSearchName = contextName.toLowerCase().trim()

  for (const doc of snapshot.docs) {
    const context = doc.data()
    const normalizedContextName = (context.name || "").toLowerCase().trim()

    if (normalizedContextName === normalizedSearchName) {
      return {
        id: doc.id,
        name: context.name,
        description: context.description,
        status: context.status,
        userId: context.userId,
        teamId: context.teamId,
        createdAt: context.createdAt?.toDate() || new Date(),
        updatedAt: context.updatedAt?.toDate(),
        lastReviewed: context.lastReviewed?.toDate(),
      } as Context
    }
  }

  return null
}

/**
 * Envía un mensaje de WhatsApp a través de Evolution API
 */
async function sendWhatsAppMessage(phoneNumber: string, message: string): Promise<void> {
  try {
    const evolutionApiUrl = process.env.EVOLUTION_API_URL
    const instanceName = process.env.EVOLUTION_INSTANCE_NAME

    if (!evolutionApiUrl || !instanceName) {
      console.error("❌ Variables de Evolution API no configuradas")
      return
    }

    const response = await fetch(`${evolutionApiUrl}/message/sendText/${instanceName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.EVOLUTION_API_KEY || "",
      },
      body: JSON.stringify({
        number: phoneNumber,
        text: message,
      }),
    })

    if (!response.ok) {
      console.error("❌ Error enviando mensaje de WhatsApp:", response.statusText)
    } else {
      console.log("✅ Mensaje enviado a WhatsApp")
    }
  } catch (error) {
    console.error("❌ Error enviando mensaje:", error)
  }
}

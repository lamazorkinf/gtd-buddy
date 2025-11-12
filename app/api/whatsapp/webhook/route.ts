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

// Obtener usuario por número de teléfono
async function getUserByPhoneNumber(whatsappNumber: string): Promise<any | null> {
  const { db } = getFirebaseAdmin()
  const normalized = normalizeWhatsAppNumber(whatsappNumber)

  const snapshot = await db
    .collection("users")
    .where("phoneNumber", "==", normalized)
    .limit(1)
    .get()

  if (snapshot.empty) {
    return null
  }

  return snapshot.docs[0].data()
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

    const { db } = getFirebaseAdmin()

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

    // Verificar si el mensaje ya fue procesado (evitar duplicados)
    const messageId = webhook.data.key.id
    const processedMessageRef = db.collection("processedMessages").doc(messageId)
    const processedMessageDoc = await processedMessageRef.get()

    if (processedMessageDoc.exists) {
      console.log("⏭️ Mensaje ya procesado, ignorando")
      return NextResponse.json({ success: true, message: "Mensaje ya procesado" })
    }

    // Verificar timestamp del mensaje (ignorar mensajes antiguos > 5 minutos)
    const messageTimestamp = webhook.data.messageTimestamp * 1000 // Convertir a ms
    const currentTime = Date.now()
    const fiveMinutesInMs = 5 * 60 * 1000

    if (currentTime - messageTimestamp > fiveMinutesInMs) {
      console.log("⏭️ Mensaje antiguo (más de 5 minutos), ignorando")
      // Marcar como procesado para no volverlo a procesar
      await processedMessageRef.set({
        messageId,
        processedAt: new Date(),
        reason: "old_message"
      })
      return NextResponse.json({ success: true, message: "Mensaje antiguo ignorado" })
    }

    // Solo procesar mensajes de texto, audio, botones y listas
    const messageType = webhook.data.messageType
    if (
      messageType !== "conversation" &&
      messageType !== "extendedTextMessage" &&
      messageType !== "audioMessage" &&
      messageType !== "buttonsResponseMessage" &&
      messageType !== "listResponseMessage"
    ) {
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
    } else if (messageType === "buttonsResponseMessage") {
      // Manejar respuesta de botón
      const buttonId = webhook.data.message?.buttonsResponseMessage?.selectedButtonId
      console.log("🔘 Botón presionado:", buttonId)

      // Convertir el buttonId en un comando
      if (buttonId === "inbox") {
        textMessage = "/inbox"
      } else if (buttonId === "hoy") {
        textMessage = "/hoy"
      } else if (buttonId === "proximas") {
        textMessage = "/proximas"
      }
    } else if (messageType === "listResponseMessage") {
      // Manejar respuesta de lista
      const listResponse = webhook.data.message?.listResponseMessage
      const rowId = listResponse?.singleSelectReply?.selectedRowId
      console.log("📋 Opción de lista seleccionada:", rowId)

      // Convertir el rowId en un comando
      if (rowId === "inbox") {
        textMessage = "/inbox"
      } else if (rowId === "hoy") {
        textMessage = "/hoy"
      } else if (rowId === "proximas") {
        textMessage = "/proximas"
      }
    }

    if (!textMessage && !audioUrl) {
      console.log("⚠️ No se pudo extraer contenido del mensaje", {
        messageType,
        message: JSON.stringify(webhook.data.message)
      })
      return NextResponse.json({ error: "Sin contenido" }, { status: 400 })
    }

    console.log("📝 Contenido extraído:", { textMessage, audioUrl })

    // Detectar comandos que no requieren autenticación
    if (textMessage) {
      const command = textMessage.trim().toLowerCase()

      // Comando: /ayuda o /help (no requiere autenticación)
      if (command === "/ayuda" || command === "/help") {
        await sendWhatsAppMessage(
          phoneNumber,
          `📖 *Comandos disponibles*\n\n` +
          `*Crear tareas:*\n` +
          `• Envía un mensaje de texto o audio describiendo tu tarea\n` +
          `• Ejemplo: "Llamar al dentista mañana @llamadas"\n\n` +
          `*Consultas:*\n` +
          `/menu - Menú interactivo con botones\n` +
          `/inbox - Ver tareas sin procesar\n` +
          `/hoy - Ver tareas para hoy\n` +
          `/proximas - Ver próximas acciones\n\n` +
          `*Ayuda:*\n` +
          `/ayuda - Ver este mensaje\n\n` +
          `💡 Tip: Menciona contextos con @ (ej: @casa, @oficina)`
        )
        return NextResponse.json({ success: true, message: "Ayuda enviada" })
      }
    }

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

    // Buscar userId asociado al número de WhatsApp (cuenta vinculada)
    let userId = await getUserIdByWhatsAppNumber(phoneNumber)

    if (!userId) {
      // No está vinculado, buscar si el número está registrado en algún usuario
      console.log("⚠️ Usuario no vinculado, buscando por phoneNumber...")
      const userByPhone = await getUserByPhoneNumber(phoneNumber)

      if (userByPhone) {
        // Usuario existe pero no ha vinculado
        const subscriptionStatus = userByPhone.subscriptionStatus

        if (
          subscriptionStatus === "active" ||
          subscriptionStatus === "trial" ||
          subscriptionStatus === "test" ||
          userByPhone.role === "test"
        ) {
          // Tiene suscripción activa, pedirle que vincule
          console.log("✅ Usuario registrado con suscripción activa, no vinculado")
          await sendWhatsAppMessage(
            phoneNumber,
            `¡Hola ${userByPhone.firstName || ""}! 👋\n\nDetectamos que tienes una cuenta en GTD Buddy.\n\nPara usar WhatsApp, vincula tu cuenta:\n\n1. Ingresa a ${process.env.NEXT_PUBLIC_APP_URL}profile\n2. Ve a la pestaña "WhatsApp"\n3. Genera tu código de vinculación\n4. Envíame ese código de 6 dígitos`
          )
        } else {
          // Usuario registrado pero sin suscripción
          console.log("⚠️ Usuario registrado sin suscripción activa")
          await sendWhatsAppMessage(
            phoneNumber,
            `¡Hola ${userByPhone.firstName || ""}! 👋\n\nPara usar GTD Buddy por WhatsApp necesitas una suscripción activa.\n\nSuscríbete aquí:\n${process.env.NEXT_PUBLIC_APP_URL}subscription`
          )
        }
        return NextResponse.json({ error: "Usuario no vinculado" }, { status: 403 })
      } else {
        // No está registrado en absoluto
        console.log("⚠️ Número no encontrado en el sistema")
        await sendWhatsAppMessage(
          phoneNumber,
          `¡Hola! 👋\n\nPara usar GTD Buddy por WhatsApp:\n\n1. Regístrate en ${process.env.NEXT_PUBLIC_APP_URL}\n2. Activa tu período de prueba gratuito\n3. Vincula tu WhatsApp desde el perfil\n\n¡Te esperamos!`
        )
        return NextResponse.json({ error: "Usuario no registrado" }, { status: 403 })
      }
    }

    console.log("👤 Usuario encontrado:", userId)

    // Verificar suscripción del usuario
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
        `⚠️ Tu suscripción ha expirado.\n\nPara seguir usando GTD Buddy, renueva tu suscripción en:\n${process.env.NEXT_PUBLIC_APP_URL}dashboard`
      )
      return NextResponse.json({ error: "Suscripción inactiva" }, { status: 403 })
    }

    // Detectar comandos que requieren autenticación
    if (textMessage) {
      const command = textMessage.trim().toLowerCase()

      // Comando: /menu
      if (command === "/menu") {
        await sendWhatsAppButtons(phoneNumber)
        return NextResponse.json({ success: true, message: "Menú enviado" })
      }

      // Comando: /inbox
      if (command === "/inbox") {
        await handleInboxCommand(phoneNumber, userId)
        return NextResponse.json({ success: true, message: "Inbox enviado" })
      }

      // Comando: /hoy
      if (command === "/hoy") {
        await handleTodayCommand(phoneNumber, userId)
        return NextResponse.json({ success: true, message: "Tareas de hoy enviadas" })
      }

      // Comando: /proximas
      if (command === "/proximas" || command === "/próximas") {
        await handleNextActionsCommand(phoneNumber, userId)
        return NextResponse.json({ success: true, message: "Próximas acciones enviadas" })
      }

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

    // Verificar si NO es una tarea (conversación casual)
    if (!processedData.isTask) {
      console.log("👋 Mensaje no es una tarea (conversación casual), respondiendo amigablemente")
      await sendWhatsAppMessage(
        phoneNumber,
        `¡Hola! 👋\n\nEstoy aquí para ayudarte con tus tareas.\n\nPuedes:\n• Enviarme una tarea (ej: "Llamar al dentista mañana")\n• Ver tus tareas con /inbox, /hoy, /proximas\n• Ver el menú con /menu`
      )
      // Marcar como procesado para no crear tarea
      await processedMessageRef.set({
        messageId,
        processedAt: new Date(),
        userId,
        reason: "not_a_task"
      })
      return NextResponse.json({ success: true, message: "Conversación casual procesada" })
    }

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

    await sendWhatsAppMessage(phoneNumber, confirmationMessage)

    // Marcar mensaje como procesado
    await processedMessageRef.set({
      messageId,
      processedAt: new Date(),
      userId,
      taskId: taskRef.id,
      reason: "task_created"
    })

    return NextResponse.json({
      success: true,
      taskId: taskRef.id,
      processedData,
    })
  } catch (error: any) {
    console.error("❌ Error procesando webhook:", error)

    // Intentar enviar mensaje de error al usuario si tenemos el número
    try {
      const phoneNumber = extractPhoneNumber(webhook?.data?.key?.remoteJid || "")
      if (phoneNumber) {
        let errorMessage = "❌ Hubo un error procesando tu mensaje.\n\n"

        // Mensajes de error específicos según el tipo
        if (error.message?.includes("transcribir")) {
          errorMessage += "No pude procesar el audio. Por favor, intenta:\n• Enviar un audio más corto\n• Enviar el mensaje como texto"
        } else if (error.message?.includes("OpenAI") || error.message?.includes("API key")) {
          errorMessage += "Hay un problema temporal con el servicio de IA. Intenta nuevamente en unos minutos."
        } else if (error.message?.includes("suscripción") || error.message?.includes("subscription")) {
          errorMessage += "Tu suscripción no está activa. Renuévala en el dashboard."
        } else if (error.message?.includes("vinculación") || error.message?.includes("link")) {
          errorMessage += "Tu cuenta no está vinculada correctamente. Por favor, vincula nuevamente desde el dashboard."
        } else {
          errorMessage += "Intenta enviar el mensaje nuevamente.\n\nSi el problema persiste, contacta con soporte."
        }

        await sendWhatsAppMessage(phoneNumber, errorMessage)
      }
    } catch (notificationError) {
      console.error("No se pudo enviar notificación de error al usuario:", notificationError)
    }

    return NextResponse.json({
      error: "Error interno del servidor",
      message: error.message
    }, { status: 500 })
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

/**
 * Envía lista interactiva de WhatsApp para el menú
 */
async function sendWhatsAppButtons(phoneNumber: string): Promise<void> {
  try {
    const evolutionApiUrl = process.env.EVOLUTION_API_URL
    const instanceName = process.env.EVOLUTION_INSTANCE_NAME

    if (!evolutionApiUrl || !instanceName) {
      console.error("❌ Variables de Evolution API no configuradas")
      return
    }

    const response = await fetch(`${evolutionApiUrl}/message/sendList/${instanceName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.EVOLUTION_API_KEY || "",
      },
      body: JSON.stringify({
        number: phoneNumber,
        title: "GTD Buddy - Menú",
        description: "Selecciona una opción para consultar tus tareas",
        buttonText: "Ver opciones",
        footerText: "GTD Buddy",
        sections: [
          {
            title: "📋 Consultas",
            rows: [
              {
                title: "📥 Ver Inbox",
                description: "Tareas sin procesar",
                rowId: "inbox"
              },
              {
                title: "📅 Tareas de hoy",
                description: "Tareas programadas para hoy",
                rowId: "hoy"
              },
              {
                title: "⚡ Próximas acciones",
                description: "Acciones listas para ejecutar",
                rowId: "proximas"
              }
            ]
          }
        ]
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ Error enviando lista de WhatsApp:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      })
      // Fallback: enviar mensaje de texto con opciones
      await sendWhatsAppMessage(
        phoneNumber,
        `📋 *Menú de opciones*\n\n` +
        `Escribe uno de estos comandos:\n\n` +
        `/inbox - Ver tareas sin procesar\n` +
        `/hoy - Ver tareas para hoy\n` +
        `/proximas - Ver próximas acciones\n` +
        `/ayuda - Ver todos los comandos`
      )
    } else {
      const responseData = await response.json()
      console.log("✅ Lista interactiva enviada a WhatsApp:", responseData)
    }
  } catch (error) {
    console.error("❌ Error enviando lista:", error)
    // Fallback: enviar mensaje de texto
    await sendWhatsAppMessage(
      phoneNumber,
      `📋 *Menú de opciones*\n\n` +
      `Escribe uno de estos comandos:\n\n` +
      `/inbox - Ver tareas sin procesar\n` +
      `/hoy - Ver tareas para hoy\n` +
      `/proximas - Ver próximas acciones\n` +
      `/ayuda - Ver todos los comandos`
    )
  }
}

/**
 * Maneja el comando /inbox - muestra tareas sin procesar
 */
async function handleInboxCommand(phoneNumber: string, userId: string): Promise<void> {
  try {
    const { db } = getFirebaseAdmin()

    // Obtener todas las tareas del usuario y filtrar en memoria para evitar necesidad de índices
    const snapshot = await db
      .collection("tasks")
      .where("userId", "==", userId)
      .where("completed", "==", false)
      .get()

    // Filtrar por categoría Inbox y ordenar en memoria
    const inboxTasks = snapshot.docs
      .filter(doc => doc.data().category === "Inbox")
      .sort((a, b) => {
        const aTime = a.data().createdAt?.toDate()?.getTime() || 0
        const bTime = b.data().createdAt?.toDate()?.getTime() || 0
        return bTime - aTime // Orden descendente
      })
      .slice(0, 10) // Limitar a 10

    if (inboxTasks.length === 0) {
      await sendWhatsAppMessage(
        phoneNumber,
        `📥 *Inbox vacío*\n\n¡Excelente! No tienes tareas pendientes de procesar.\n\n💡 Envía un mensaje para crear una nueva tarea.`
      )
      return
    }

    let message = `📥 *Inbox* (${inboxTasks.length} tarea${inboxTasks.length > 1 ? 's' : ''})\n\n`

    inboxTasks.forEach((doc, index) => {
      const task = doc.data()
      message += `${index + 1}. ${task.title}\n`
      if (task.description && task.description !== `Creado desde WhatsApp por ${task.pushName || 'Usuario'}`) {
        message += `   _${task.description.substring(0, 50)}${task.description.length > 50 ? '...' : ''}_\n`
      }
      message += `\n`
    })

    message += `\n💡 Procesa estas tareas desde el dashboard:\n${process.env.NEXT_PUBLIC_APP_URL}dashboard`

    await sendWhatsAppMessage(phoneNumber, message)
  } catch (error) {
    console.error("❌ Error en handleInboxCommand:", error)
    await sendWhatsAppMessage(
      phoneNumber,
      `❌ No pude obtener tu inbox.\n\nIntenta nuevamente en unos momentos.`
    )
  }
}

/**
 * Maneja el comando /hoy - muestra tareas para hoy
 */
async function handleTodayCommand(phoneNumber: string, userId: string): Promise<void> {
  try {
    const { db } = getFirebaseAdmin()

    // Obtener inicio y fin del día
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

    // Obtener todas las tareas no completadas y filtrar en memoria
    const snapshot = await db
      .collection("tasks")
      .where("userId", "==", userId)
      .where("completed", "==", false)
      .get()

    // Filtrar por fecha de hoy y ordenar en memoria
    const todayTasks = snapshot.docs
      .filter(doc => {
        const dueDate = doc.data().dueDate?.toDate()
        return dueDate && dueDate >= startOfDay && dueDate <= endOfDay
      })
      .sort((a, b) => {
        const aTime = a.data().dueDate?.toDate()?.getTime() || 0
        const bTime = b.data().dueDate?.toDate()?.getTime() || 0
        return aTime - bTime // Orden ascendente por hora
      })
      .slice(0, 15) // Limitar a 15

    if (todayTasks.length === 0) {
      await sendWhatsAppMessage(
        phoneNumber,
        `📅 *Tareas de hoy*\n\nNo tienes tareas programadas para hoy.\n\n💡 ¿Qué tal revisar tus próximas acciones con /proximas?`
      )
      return
    }

    let message = `📅 *Tareas de hoy* (${todayTasks.length} tarea${todayTasks.length > 1 ? 's' : ''})\n\n`

    todayTasks.forEach((doc, index) => {
      const task = doc.data()
      const dueDate = task.dueDate?.toDate()
      const timeStr = dueDate ? dueDate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : ''

      message += `${index + 1}. ${task.title}`
      if (timeStr) {
        message += ` ⏰ ${timeStr}`
      }
      message += `\n`

      if (task.contextId) {
        // Nota: necesitaríamos hacer otra consulta para obtener el nombre del contexto
        // Por ahora solo mostramos que tiene contexto
        message += `   🏷️ Con contexto\n`
      }

      if (task.estimatedMinutes) {
        message += `   ⏱️ ${task.estimatedMinutes} min\n`
      }

      message += `\n`
    })

    message += `\n🎯 ¡A por ellas!\n\nVer más en: ${process.env.NEXT_PUBLIC_APP_URL}dashboard`

    await sendWhatsAppMessage(phoneNumber, message)
  } catch (error) {
    console.error("❌ Error en handleTodayCommand:", error)
    await sendWhatsAppMessage(
      phoneNumber,
      `❌ No pude obtener tus tareas de hoy.\n\nIntenta nuevamente en unos momentos.`
    )
  }
}

/**
 * Maneja el comando /proximas - muestra próximas acciones
 */
async function handleNextActionsCommand(phoneNumber: string, userId: string): Promise<void> {
  try {
    const { db } = getFirebaseAdmin()

    // Obtener todas las tareas no completadas y filtrar en memoria
    const snapshot = await db
      .collection("tasks")
      .where("userId", "==", userId)
      .where("completed", "==", false)
      .get()

    // Filtrar por categoría Próximas acciones y ordenar en memoria
    const nextActionsTasks = snapshot.docs
      .filter(doc => doc.data().category === "Próximas acciones")
      .sort((a, b) => {
        const aTime = a.data().createdAt?.toDate()?.getTime() || 0
        const bTime = b.data().createdAt?.toDate()?.getTime() || 0
        return bTime - aTime // Orden descendente
      })
      .slice(0, 10) // Limitar a 10

    if (nextActionsTasks.length === 0) {
      await sendWhatsAppMessage(
        phoneNumber,
        `⚡ *Próximas acciones*\n\nNo tienes próximas acciones definidas.\n\n💡 Procesa tu inbox para identificar acciones concretas.`
      )
      return
    }

    let message = `⚡ *Próximas acciones* (${nextActionsTasks.length} acción${nextActionsTasks.length > 1 ? 'es' : ''})\n\n`

    nextActionsTasks.forEach((doc, index) => {
      const task = doc.data()
      message += `${index + 1}. ${task.title}\n`

      if (task.dueDate) {
        const dueDate = task.dueDate.toDate()
        const dateStr = dueDate.toLocaleDateString('es-AR', {
          weekday: 'short',
          day: 'numeric',
          month: 'short'
        })
        message += `   📅 ${dateStr}\n`
      }

      if (task.estimatedMinutes) {
        message += `   ⏱️ ${task.estimatedMinutes} min\n`
      }

      message += `\n`
    })

    message += `\n💪 ¡Manos a la obra!\n\nVer más en: ${process.env.NEXT_PUBLIC_APP_URL}dashboard`

    await sendWhatsAppMessage(phoneNumber, message)
  } catch (error) {
    console.error("❌ Error en handleNextActionsCommand:", error)
    await sendWhatsAppMessage(
      phoneNumber,
      `❌ No pude obtener tus próximas acciones.\n\nIntenta nuevamente en unos momentos.`
    )
  }
}

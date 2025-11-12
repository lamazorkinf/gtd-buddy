import OpenAI from "openai"
import type { ProcessedTaskData, ProcessedIntent, ConversationContext } from "@/types/whatsapp"
import type { GTDCategory } from "@/types/task"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Descarga audio desde Evolution API (maneja audios encriptados de WhatsApp)
 * @param messageId ID del mensaje
 * @param remoteJid JID del remitente
 * @returns Buffer con el audio desencriptado
 */
async function downloadAudioFromEvolution(messageId: string, remoteJid: string): Promise<Buffer> {
  const evolutionUrl = process.env.EVOLUTION_API_URL
  const instanceName = process.env.EVOLUTION_INSTANCE_NAME
  const apiKey = process.env.EVOLUTION_API_KEY

  if (!evolutionUrl || !instanceName || !apiKey) {
    throw new Error("Configuración de Evolution API incompleta")
  }

  // Probar diferentes endpoints de Evolution API
  const possibleEndpoints = [
    `${evolutionUrl}/chat/getBase64FromMediaMessage/${instanceName}`,
    `${evolutionUrl}/message/downloadMedia/${instanceName}`,
    `${evolutionUrl}/chat/downloadMedia/${instanceName}`,
  ]

  console.log("📥 Descargando audio desde Evolution API...")

  let lastError: Error | null = null

  for (const url of possibleEndpoints) {
    try {
      console.log("🔍 Probando endpoint:", url)

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": apiKey,
        },
        body: JSON.stringify({
          message: {
            key: {
              id: messageId,
              remoteJid: remoteJid,
            }
          }
        })
      })

      if (response.ok) {
        const data = await response.json()

        // Evolution API puede devolver el audio en base64 con diferentes campos
        const base64Data = data.base64 || data.mediaBase64 || data.base64Media || data.media?.base64

        if (base64Data) {
          const buffer = Buffer.from(base64Data, 'base64')
          console.log("✅ Audio descargado desde Evolution API, tamaño:", buffer.length, "bytes")
          return buffer
        }

        console.log("⚠️ Respuesta recibida pero sin base64:", Object.keys(data))
      } else {
        console.log(`❌ Endpoint falló con ${response.status}: ${response.statusText}`)
      }
    } catch (error: any) {
      console.log(`❌ Error en endpoint: ${error.message}`)
      lastError = error
    }
  }

  throw new Error(`No se pudo descargar audio desde Evolution API. Último error: ${lastError?.message || "Ningún endpoint funcionó"}`)
}

/**
 * Transcribe un archivo de audio usando Whisper API
 * @param audioUrl URL del archivo de audio (puede estar encriptado)
 * @param messageId ID del mensaje (para descargar desde Evolution API)
 * @param remoteJid JID del remitente
 * @returns Texto transcrito
 */
export async function transcribeAudio(audioUrl: string, messageId?: string, remoteJid?: string): Promise<string> {
  try {
    let audioBuffer: Buffer
    let mimeType = "audio/ogg"

    // Si el audio está encriptado (.enc), usar Evolution API para descargarlo
    if (audioUrl.includes('.enc') && messageId && remoteJid) {
      console.log("🔐 Audio encriptado detectado, usando Evolution API...")
      audioBuffer = await downloadAudioFromEvolution(messageId, remoteJid)
    } else {
      // Descargar audio directamente
      console.log("🎤 Descargando audio desde:", audioUrl)
      const response = await fetch(audioUrl)

      if (!response.ok) {
        console.error("❌ Error descargando audio:", response.status, response.statusText)
        throw new Error(`Error descargando audio: ${response.statusText}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      audioBuffer = Buffer.from(arrayBuffer)
      mimeType = response.headers.get("content-type") || "audio/ogg"
    }

    console.log("📦 Audio listo para transcripción, tamaño:", audioBuffer.length, "bytes")

    // Crear blob y file
    const audioBlob = new Blob([audioBuffer], { type: mimeType })
    const audioFile = new File([audioBlob], "audio.ogg", { type: mimeType })

    // Transcribir con Whisper
    console.log("🤖 Enviando a Whisper para transcripción...")
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language: "es", // Español
    })

    console.log("✅ Audio transcrito:", transcription.text.substring(0, 100) + "...")
    return transcription.text
  } catch (error: any) {
    console.error("❌ Error transcribiendo audio:", {
      message: error?.message,
      status: error?.response?.status,
      data: error?.response?.data
    })
    throw new Error(`No se pudo transcribir el audio: ${error?.message || "Error desconocido"}`)
  }
}

/**
 * Detecta la intención del usuario y procesa el mensaje en consecuencia
 * @param text Texto del mensaje
 * @param conversationContext Contexto de la conversación (mensajes previos, última tarea, etc.)
 * @returns Intención procesada con parámetros
 */
export async function detectUserIntent(
  text: string,
  conversationContext?: Partial<ConversationContext>
): Promise<ProcessedIntent> {
  try {
    const systemPrompt = `Eres un asistente experto en el método GTD que analiza mensajes de WhatsApp para detectar la intención del usuario.

INTENCIONES POSIBLES:
1. "create_task" - El usuario quiere crear una tarea nueva
   Ejemplos: "Llamar al dentista mañana", "Comprar leche"

2. "view_tasks" - El usuario quiere ver sus tareas
   Ejemplos: "muéstrame mis tareas", "qué tengo para hoy", "inbox", "/hoy", "/próximas"
   Parámetros: taskFilter puede ser "inbox", "today", "next_actions", "all"

3. "complete_task" - El usuario quiere marcar una tarea como completada
   Ejemplos: "completé esa tarea", "ya hice eso", "marcar como hecha"
   needsContext: true (requiere saber cuál fue la última tarea)

4. "edit_task" - El usuario quiere editar una tarea
   Ejemplos:
   - "cambiar la fecha a mañana"
   - "modificar el título a Llamar al doctor"
   - "cambiar la descripción"
   - "mover a pasado mañana"
   - "cambiar el contexto a @casa"
   needsContext: true (requiere saber cuál tarea editar)
   Parámetros:
   - editField: "title" | "description" | "dueDate" | "context" | "category"
   - editValue: nuevo valor (puede ser una fecha relativa como "mañana", "pasado mañana")

5. "add_context" - El usuario quiere agregar contexto a la última tarea
   Ejemplos: "agregar eso a @Vilma", "poner esa tarea en @casa", "añadir contexto @oficina"
   needsContext: true (requiere saber cuál fue la última tarea)
   Parámetros: contextName (sin el @)

6. "help" - El usuario pide ayuda o el menú
   Ejemplos: "ayuda", "help", "menu", "qué puedes hacer"

7. "greeting" - Saludo o conversación casual
   Ejemplos: "hola", "gracias", "ok", "dale"

IMPORTANTE:
- Si el mensaje es una tarea nueva clara, usa "create_task" y analiza la tarea completa
- Si el usuario menciona "la tarea anterior", "esa tarea", "la última", necesita contexto (needsContext: true)
- Si el usuario dice "agregar a @contexto" o "poner en @lugar", es "add_context"
- Los comandos como /inbox, /hoy, /próximas son "view_tasks"
- Sé conservador: ante la duda sobre crear tarea vs otra intención, elige la otra intención

CATEGORIZACIÓN GTD AUTOMÁTICA (para create_task):
✅ Si tiene fecha/hora → "Próximas acciones"
✅ Si espera a otros/respuesta → "A la espera"
✅ Si es proyecto grande/múltiples pasos → "Multitarea"
✅ Si es idea/recomendación sin urgencia (leer libro, ver película, investigar) → "Algún día"
✅ Si hay duda → "Inbox"

Ejemplos de categorización:
- "Llamar al dentista mañana" → Próximas acciones (tiene fecha)
- "Esperar respuesta de Juan" → A la espera (depende de otro)
- "Organizar evento de fin de año" → Multitarea (proyecto grande)
- "Me recomendaron leer El Principito" → Algún día (recomendación sin urgencia)
- "Comprar algo" → Inbox (muy vago)

Responde SOLO con JSON válido, sin markdown.`

    const historyContext = conversationContext?.conversationHistory
      ?.slice(-3) // Últimos 3 mensajes
      .map(msg => `${msg.role === 'user' ? 'Usuario' : 'Asistente'}: ${msg.content}`)
      .join('\n') || 'Sin historial previo'

    const lastTaskInfo = conversationContext?.lastTaskId
      ? `Última tarea creada/mencionada: ID ${conversationContext.lastTaskId}`
      : 'Sin tareas previas en esta conversación'

    // Obtener fecha actual en Argentina
    const now = new Date()
    const todayInArgentina = now.toLocaleDateString('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).split('/').reverse().join('-')

    const tomorrowInArgentina = new Date(Date.now() + 86400000).toLocaleDateString('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).split('/').reverse().join('-')

    const dayAfterTomorrowInArgentina = new Date(Date.now() + 172800000).toLocaleDateString('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).split('/').reverse().join('-')

    const userPrompt = `HOY ES: ${todayInArgentina} (YYYY-MM-DD)

IMPORTANTE: Para fechas relativas, usa:
- "mañana" = ${tomorrowInArgentina}
- "pasado mañana" = ${dayAfterTomorrowInArgentina}

Contexto de conversación:
${historyContext}

${lastTaskInfo}

Mensaje actual del usuario:
"${text}"

Responde con JSON en este formato:
{
  "intent": "create_task" | "view_tasks" | "complete_task" | "edit_task" | "add_context" | "help" | "greeting",
  "confidence": number (0.0 a 1.0),
  "needsContext": boolean (true si requiere saber la tarea previa),
  "parameters": {
    "taskFilter": "inbox" | "today" | "next_actions" | "all" (solo para view_tasks),
    "contextName": "string sin @" (solo para add_context o edit_task cuando editField es "context"),
    "editField": "title" | "description" | "dueDate" | "context" | "category" (solo para edit_task),
    "editValue": "string o YYYY-MM-DD para fechas" (solo para edit_task),
    "category": "Inbox | Próximas acciones | Multitarea | A la espera | Algún día" (solo para edit_task cuando editField es "category")
  },
  "taskData": {
    // Solo si intent es "create_task", incluir análisis completo de la tarea
    "isTask": true,
    "title": "string",
    "description": "string opcional",
    "contextName": "string opcional sin @",
    "dueDate": "YYYY-MM-DD opcional (DEBE SER 2025 o posterior)",
    "estimatedMinutes": number opcional,
    "category": "Inbox | Próximas acciones | Multitarea | A la espera | Algún día",
    "isQuickAction": boolean,
    "confidence": number
  }
}`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    })

    const responseText = completion.choices[0].message.content
    if (!responseText) {
      throw new Error("No se recibió respuesta de OpenAI")
    }

    console.log("🤖 Respuesta raw de OpenAI (detectUserIntent):", responseText)
    const parsed = JSON.parse(responseText)
    console.log("📊 Intent parseado:", JSON.stringify(parsed, null, 2))

    // Parsear taskData si existe
    let taskData: ProcessedTaskData | undefined
    if (parsed.taskData && parsed.intent === "create_task") {
      let dueDateObj: Date | undefined = undefined
      if (parsed.taskData.dueDate) {
        console.log("📅 Procesando fecha en detectUserIntent:", parsed.taskData.dueDate)
        const [year, month, day] = parsed.taskData.dueDate.split('-').map(Number)
        console.log("📅 Componentes parseados:", { year, month, day })
        dueDateObj = new Date(Date.UTC(year, month - 1, day, 23 + 3, 59, 0))
        console.log("📅 Date object creado:", dueDateObj.toISOString())
        console.log("📅 Fecha legible AR:", dueDateObj.toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }))
      }

      taskData = {
        isTask: true,
        title: parsed.taskData.title?.substring(0, 80) || text.substring(0, 80),
        description: parsed.taskData.description || undefined,
        contextName: parsed.taskData.contextName || undefined,
        dueDate: dueDateObj,
        estimatedMinutes: parsed.taskData.estimatedMinutes || undefined,
        category: (parsed.taskData.category as GTDCategory) || "Inbox",
        isQuickAction: parsed.taskData.isQuickAction || false,
        confidence: parsed.taskData.confidence || 0.5,
      }
    }

    const result: ProcessedIntent = {
      intent: parsed.intent,
      confidence: parsed.confidence || 0.5,
      needsContext: parsed.needsContext || false,
      parameters: parsed.parameters || {},
      taskData,
    }

    return result
  } catch (error) {
    console.error("Error detectando intención:", error)

    // Fallback: intentar crear tarea
    return {
      intent: "create_task",
      confidence: 0.1,
      taskData: {
        isTask: true,
        title: text.substring(0, 80),
        description: text.length > 80 ? text : undefined,
        category: "Inbox",
        isQuickAction: false,
        confidence: 0.1,
      },
    }
  }
}

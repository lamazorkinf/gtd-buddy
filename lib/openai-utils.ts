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
 * Analiza un texto usando GPT-4 para extraer información de tarea GTD
 * @param text Texto a analizar (puede ser transcripción de audio o texto directo)
 * @returns Datos de tarea procesados
 */
export async function analyzeTaskText(text: string): Promise<ProcessedTaskData> {
  try {
    const systemPrompt = `Eres un asistente experto en el método GTD (Getting Things Done).
Tu trabajo es analizar mensajes de WhatsApp y determinar si son tareas o conversación casual.

PRIMERO: Determina si el mensaje es una TAREA o NO:
- Saludos: "hola", "hi", "buenos días", "qué tal", etc.
- Despedidas: "chau", "adiós", "bye", "hasta luego", etc.
- Agradecimientos: "gracias", "thanks", etc.
- Respuestas cortas sin acción: "ok", "dale", "sí", "no", "👍", etc.
- Conversación casual: preguntas generales, comentarios, etc.
- Si es alguno de estos, marca isTask como false

TAREAS VÁLIDAS son mensajes que indican una acción a realizar:
- "Llamar al dentista mañana"
- "Comprar leche y pan"
- "Revisar el informe antes del viernes"
- "Recordar enviar email a Juan"

Categorías GTD - ANALIZA AUTOMÁTICAMENTE según estas reglas:

1. "Próximas acciones" - Úsala cuando:
   - Tiene fecha/hora específica ("mañana a las 3pm", "el lunes", "en 2 días")
   - Es una acción concreta y clara que se puede hacer directamente
   - El usuario puede hacerla sin depender de otros
   - Ejemplo: "Llamar al dentista mañana", "Enviar informe el viernes"

2. "A la espera" - Úsala cuando:
   - Depende de otra persona o respuesta externa
   - Menciona esperar algo: "esperar respuesta", "cuando me contesten"
   - Involucra delegación o coordinación con otros
   - Ejemplos: "Esperar respuesta de Juan", "Recordar preguntar a María sobre..."

3. "Multitarea" - Úsala cuando:
   - Es algo grande que claramente requiere múltiples pasos
   - Menciona "proyecto", "organizar", "planificar algo grande"
   - Involucra varias acciones diferentes
   - Ejemplos: "Organizar evento de fin de año", "Proyecto de renovación casa"

4. "Algún día" - Úsala cuando:
   - Es una idea, sugerencia o inspiración sin urgencia
   - Menciona: "me recomendaron", "algún día", "cuando tenga tiempo"
   - Libros para leer, películas para ver, lugares para visitar
   - Ideas para explorar o investigar sin fecha definida
   - NO tiene fecha ni hora
   - Ejemplos: "Leer libro X", "Ver película Y", "Investigar sobre Z", "Aprender idioma"

5. "Inbox" - Úsala cuando:
   - NO está claro en qué categoría va
   - Es muy ambigua o necesita más procesamiento
   - El usuario solo captura la idea rápido sin detalles
   - Ante la DUDA, siempre usa Inbox

Contextos comunes: @casa, @oficina, @llamadas, @compras, @computadora, @recados, @reuniones, @email

REGLAS DE CATEGORIZACIÓN:
✅ SIEMPRE categoriza automáticamente según el contenido
✅ Si tiene fecha/hora → "Próximas acciones"
✅ Si espera a otros → "A la espera"
✅ Si es proyecto grande → "Multitarea"
✅ Si es idea/recomendación sin urgencia → "Algún día"
✅ Si hay duda → "Inbox"
⚠️ NO uses "Inbox" si puedes determinar claramente la categoría
⚠️ Las fechas relativas deben calcularse desde hoy
⚠️ NO intentes adivinar si una tarea es rápida (isQuickAction siempre false)

Responde SOLO con un JSON válido, sin markdown ni explicaciones adicionales.`

    // Obtener fecha y hora actual en zona horaria de Argentina
    const now = new Date()
    const todayInArgentina = now.toLocaleDateString('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).split('/').reverse().join('-') // Convertir DD/MM/YYYY a YYYY-MM-DD

    const timeInArgentina = now.toLocaleTimeString('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })

    const userPrompt = `HOY ES: ${todayInArgentina} (YYYY-MM-DD)
Hora actual en Argentina: ${timeInArgentina}

IMPORTANTE: Si el mensaje menciona "mañana", debes usar ${new Date(Date.now() + 86400000).toLocaleDateString('es-AR', {
  timeZone: 'America/Argentina/Buenos_Aires',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
}).split('/').reverse().join('-')}

Si menciona "pasado mañana", usar ${new Date(Date.now() + 172800000).toLocaleDateString('es-AR', {
  timeZone: 'America/Argentina/Buenos_Aires',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
}).split('/').reverse().join('-')}

Texto a analizar:
"${text}"

Responde con JSON en este formato:
{
  "isTask": boolean (true si es una tarea, false si es saludo/conversación casual),
  "title": "string (máximo 80 caracteres, solo si isTask es true)",
  "description": "string (opcional, más detalles)",
  "contextName": "string (opcional, sin @)",
  "dueDate": "YYYY-MM-DD (opcional, DEBE SER 2025 o posterior)",
  "estimatedMinutes": number (opcional),
  "category": "Inbox | Próximas acciones | Multitarea | A la espera | Algún día",
  "isQuickAction": boolean,
  "confidence": number (0.0 a 1.0, qué tan seguro estás del análisis)
}`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3, // Baja temperatura para respuestas más consistentes
      response_format: { type: "json_object" },
    })

    const responseText = completion.choices[0].message.content
    if (!responseText) {
      throw new Error("No se recibió respuesta de OpenAI")
    }

    console.log("🤖 Respuesta raw de OpenAI (analyzeTaskText):", responseText)
    const parsed = JSON.parse(responseText)
    console.log("📊 Datos parseados:", JSON.stringify(parsed, null, 2))

    // Parsear fecha en zona horaria local de Argentina si existe
    let dueDateObj: Date | undefined = undefined
    if (parsed.dueDate) {
      console.log("📅 Procesando fecha:", parsed.dueDate)
      // Parsear la fecha como 23:59 en Argentina (UTC-3)
      // El formato es "YYYY-MM-DD"
      const [year, month, day] = parsed.dueDate.split('-').map(Number)
      console.log("📅 Fecha parseada:", { year, month, day })
      // Crear fecha a las 23:59 UTC-3 (que equivale a 02:59 del día siguiente en UTC)
      // Sumamos 3 horas para compensar la diferencia con UTC
      dueDateObj = new Date(Date.UTC(year, month - 1, day, 23 + 3, 59, 0))
      console.log("📅 Fecha final (Date object):", dueDateObj.toISOString())
      console.log("📅 Fecha final (legible):", dueDateObj.toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }))
    }

    // Validar y construir objeto ProcessedTaskData
    const processedData: ProcessedTaskData = {
      isTask: parsed.isTask ?? true, // Por defecto asumimos que es tarea si no viene el campo
      title: parsed.title?.substring(0, 80) || text.substring(0, 80), // Asegurar límite de caracteres
      description: parsed.description || undefined,
      contextName: parsed.contextName || undefined,
      dueDate: dueDateObj,
      estimatedMinutes: parsed.estimatedMinutes || undefined,
      category: (parsed.category as GTDCategory) || "Inbox",
      isQuickAction: parsed.isQuickAction || false,
      confidence: parsed.confidence || 0.5,
    }

    return processedData
  } catch (error) {
    console.error("Error analizando texto con GPT-4:", error)

    // Fallback: crear tarea básica en Inbox
    return {
      isTask: true, // En caso de error, asumimos que es tarea para no perder información
      title: text.substring(0, 80),
      description: text.length > 80 ? text : undefined,
      category: "Inbox",
      isQuickAction: false,
      confidence: 0.1, // Baja confianza en el fallback
    }
  }
}

/**
 * Procesa un mensaje de WhatsApp: transcribe audio si es necesario y analiza el texto
 * @param text Texto del mensaje (si es texto directo)
 * @param audioUrl URL del audio (si es nota de voz)
 * @param messageId ID del mensaje (para descargar audio encriptado)
 * @param remoteJid JID del remitente (para descargar audio encriptado)
 * @returns Datos de tarea procesados
 */
export async function processWhatsAppMessage(
  text?: string,
  audioUrl?: string,
  messageId?: string,
  remoteJid?: string
): Promise<ProcessedTaskData> {
  let finalText = text || ""

  // Si es audio, primero transcribir
  if (audioUrl) {
    finalText = await transcribeAudio(audioUrl, messageId, remoteJid)
  }

  if (!finalText.trim()) {
    throw new Error("No se pudo obtener texto del mensaje")
  }

  // Analizar el texto con GPT-4
  return await analyzeTaskText(finalText)
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
